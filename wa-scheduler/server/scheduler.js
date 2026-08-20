const path = require("path");
const cron = require("node-cron");
const { db, UPLOAD_DIR } = require("./db");
const wa = require("./wa-client");

// ---- helpers waktu lokal (format "YYYY-MM-DD HH:mm") ----
const pad = (n) => String(n).padStart(2, "0");

function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocal(s) {
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0);
}

function nextRun(schedule, fromDate) {
  const base = parseLocal(schedule.run_at) || fromDate;
  const d = new Date(base.getTime());
  const mode = schedule.repeat_mode;

  if (mode === "daily") {
    do {
      d.setDate(d.getDate() + 1);
    } while (d <= fromDate);
    return d;
  }

  if (mode === "weekly") {
    const days = String(schedule.weekdays || "")
      .split(",")
      .map((x) => parseInt(x, 10))
      .filter((x) => !Number.isNaN(x));
    if (days.length === 0) return null;
    for (let i = 1; i <= 14; i++) {
      const c = new Date(base.getTime());
      c.setDate(c.getDate() + i);
      if (days.includes(c.getDay()) && c > fromDate) return c;
    }
    return null;
  }

  if (mode === "monthly") {
    const day = schedule.month_day || base.getDate();
    const c = new Date(base.getTime());
    do {
      c.setMonth(c.getMonth() + 1, 1);
      const last = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
      c.setDate(Math.min(day, last));
    } while (c <= fromDate);
    return c;
  }

  return null; // once
}

function getTargets(scheduleId) {
  return db
    .prepare("SELECT * FROM schedule_targets WHERE schedule_id = ?")
    .all(scheduleId);
}

function getAttachments(scheduleId) {
  return db
    .prepare("SELECT * FROM attachments WHERE schedule_id = ?")
    .all(scheduleId)
    .map((a) => ({ ...a, fullPath: path.join(UPLOAD_DIR, a.stored_name) }));
}

function log(scheduleId, target, status, detail = "") {
  db.prepare(
    "INSERT INTO send_logs (schedule_id, target, status, detail) VALUES (?,?,?,?)",
  ).run(scheduleId, target, status, String(detail).slice(0, 500));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runSchedule(schedule) {
  const targets = getTargets(schedule.id);
  const attachments = getAttachments(schedule.id);
  let failures = 0;

  for (const t of targets) {
    const chatId = wa.toChatId(t);
    if (!chatId) {
      failures++;
      log(schedule.id, t.target_value, "failed", "Nomor tidak valid");
      continue;
    }
    try {
      const text = String(schedule.message || "").replace(
        /\{nama\}/gi,
        t.label || "",
      );
      await wa.sendMessage(chatId, text, attachments);
      log(schedule.id, t.target_value, "sent", "");
    } catch (err) {
      failures++;
      log(schedule.id, t.target_value, "failed", err.message);
    }
    // jeda acak 3-8 detik antar tujuan agar aman dari rate limit WhatsApp
    if (targets.length > 1) await sleep(3000 + Math.random() * 5000);
  }

  const now = new Date();
  const next = nextRun(schedule, now);
  const endsAt = schedule.end_date ? parseLocal(`${schedule.end_date} 23:59`) : null;

  if (next && (!endsAt || next <= endsAt)) {
    db.prepare(
      "UPDATE schedules SET run_at = ?, status = 'pending', last_error = ? WHERE id = ?",
    ).run(fmt(next), failures ? `${failures} tujuan gagal` : null, schedule.id);
  } else {
    db.prepare("UPDATE schedules SET status = ?, last_error = ? WHERE id = ?").run(
      failures === targets.length && targets.length > 0 ? "failed" : "sent",
      failures ? `${failures} tujuan gagal` : null,
      schedule.id,
    );
  }
}

let running = false;
let lastTick = null;

async function tick() {
  if (running) return;
  running = true;
  try {
    lastTick = fmt(new Date());
    if (!wa.isReady()) return;
    const now = fmt(new Date());
    const due = db
      .prepare(
        "SELECT * FROM schedules WHERE status = 'pending' AND run_at <= ? ORDER BY run_at ASC LIMIT 20",
      )
      .all(now);
    for (const s of due) {
      db.prepare("UPDATE schedules SET status = 'sending' WHERE id = ?").run(s.id);
      try {
        await runSchedule(s);
      } catch (err) {
        db.prepare(
          "UPDATE schedules SET status = 'failed', last_error = ? WHERE id = ?",
        ).run(err.message, s.id);
      }
    }
  } finally {
    running = false;
  }
}

// jadwal yang terlewat terlalu lama (PC mati/restart) tidak dikirim agar tidak basi
function expireStale() {
  const hours = Number(getSetting("catchup_hours", "12")) || 12;
  const limit = fmt(new Date(Date.now() - hours * 3600 * 1000));
  const stale = db
    .prepare("SELECT * FROM schedules WHERE status = 'pending' AND run_at < ?")
    .all(limit);

  for (const s of stale) {
    const next = nextRun(s, new Date());
    const endsAt = s.end_date ? parseLocal(`${s.end_date} 23:59`) : null;
    if (next && (!endsAt || next <= endsAt)) {
      db.prepare("UPDATE schedules SET run_at = ?, last_error = ? WHERE id = ?").run(
        fmt(next),
        `Jadwal ${s.run_at} terlewat saat PC mati, dijadwalkan ulang`,
        s.id,
      );
    } else {
      db.prepare("UPDATE schedules SET status = 'failed', last_error = ? WHERE id = ?").run(
        "Terlewat saat PC mati (melebihi batas toleransi)",
        s.id,
      );
    }
  }
  if (stale.length) console.log(`[scheduler] ${stale.length} jadwal terlewat diproses`);
}

function getLastTick() {
  return lastTick;
}

function start() {
  // pulihkan job yang tergantung saat aplikasi mati di tengah pengiriman
  db.prepare("UPDATE schedules SET status = 'pending' WHERE status = 'sending'").run();
  expireStale();
  cron.schedule("* * * * *", tick);
  // catch-up: jadwal yang jatuh tempo saat PC mati langsung diproses begitu WA siap
  setTimeout(tick, 15000);
  console.log("[scheduler] aktif, cek jadwal setiap menit");
}

module.exports = { start, tick, fmt, parseLocal, nextRun, getLastTick, expireStale };

