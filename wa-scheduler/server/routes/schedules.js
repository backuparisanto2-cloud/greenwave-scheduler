const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { db, UPLOAD_DIR } = require("../db");
const { requireAuth } = require("./auth");
const scheduler = require("../scheduler");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const router = express.Router();
router.use(requireAuth);

const targetSchema = z.object({
  target_type: z.enum(["number", "group"]).default("number"),
  target_value: z.string().min(1),
  label: z.string().default(""),
});

const bodySchema = z.object({
  title: z.string().default(""),
  message: z.string().default(""),
  repeat_mode: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
  weekdays: z.string().default(""),
  month_day: z.number().int().min(1).max(31).nullable().optional(),
  run_at: z.string().min(10),
  end_date: z.string().nullable().optional(),
  targets: z.array(targetSchema).min(1),
});

function decorate(s) {
  return {
    ...s,
    targets: db.prepare("SELECT * FROM schedule_targets WHERE schedule_id = ?").all(s.id),
    attachments: db
      .prepare("SELECT id, file_name, mime_type, size FROM attachments WHERE schedule_id = ?")
      .all(s.id),
  };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM schedules ORDER BY run_at ASC").all();
  res.json(rows.map(decorate));
});

router.post("/", upload.array("files", 5), (req, res) => {
  let payload;
  try {
    payload = JSON.parse(req.body.payload || "{}");
  } catch (_) {
    return res.status(400).json({ error: "Payload tidak valid" });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const d = parsed.data;
  const runDate = scheduler.parseLocal(d.run_at);
  if (!runDate) return res.status(400).json({ error: "Tanggal/jam tidak valid" });

  const info = db
    .prepare(
      `INSERT INTO schedules (title, message, repeat_mode, weekdays, month_day, run_at, end_date, status)
       VALUES (?,?,?,?,?,?,?,'pending')`,
    )
    .run(
      d.title,
      d.message,
      d.repeat_mode,
      d.weekdays,
      d.month_day ?? null,
      scheduler.fmt(runDate),
      d.end_date || null,
    );

  const id = info.lastInsertRowid;
  const insTarget = db.prepare(
    "INSERT INTO schedule_targets (schedule_id, target_type, target_value, label) VALUES (?,?,?,?)",
  );
  for (const t of d.targets) insTarget.run(id, t.target_type, t.target_value, t.label || "");

  const insFile = db.prepare(
    "INSERT INTO attachments (schedule_id, file_name, stored_name, mime_type, size) VALUES (?,?,?,?,?)",
  );
  for (const f of req.files || [])
    insFile.run(id, f.originalname, f.filename, f.mimetype, f.size);

  res.status(201).json(decorate(db.prepare("SELECT * FROM schedules WHERE id = ?").get(id)));
});

router.post("/:id/pause", (req, res) => {
  db.prepare("UPDATE schedules SET status = 'paused' WHERE id = ? AND status = 'pending'").run(
    req.params.id,
  );
  res.json({ ok: true });
});

router.post("/:id/resume", (req, res) => {
  db.prepare("UPDATE schedules SET status = 'pending' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/:id/send-now", async (req, res) => {
  const s = db.prepare("SELECT * FROM schedules WHERE id = ?").get(req.params.id);
  if (!s) return res.status(404).json({ error: "Jadwal tidak ditemukan" });
  db.prepare("UPDATE schedules SET run_at = ?, status = 'pending' WHERE id = ?").run(
    scheduler.fmt(new Date(Date.now() - 60000)),
    s.id,
  );
  scheduler.tick();
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  const files = db.prepare("SELECT stored_name FROM attachments WHERE schedule_id = ?").all(
    req.params.id,
  );
  db.prepare("DELETE FROM schedules WHERE id = ?").run(req.params.id);
  for (const f of files) {
    const p = path.join(UPLOAD_DIR, f.stored_name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  res.json({ ok: true });
});

router.get("/logs/all", (req, res) => {
  res.json(db.prepare("SELECT * FROM send_logs ORDER BY id DESC LIMIT 200").all());
});

module.exports = router;
