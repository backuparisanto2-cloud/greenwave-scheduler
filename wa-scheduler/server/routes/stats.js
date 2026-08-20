const path = require("path");
const fs = require("fs");
const express = require("express");
const { db, UPLOAD_DIR, getSetting } = require("../db");
const { requireAuth } = require("./auth");
const scheduler = require("../scheduler");
const wa = require("../wa-client");

const router = express.Router();
router.use(requireAuth);

const one = (sql, ...args) => db.prepare(sql).get(...args).c;

router.get("/", (req, res) => {
  const now = scheduler.fmt(new Date());
  const today = now.slice(0, 10);

  const summary = {
    sent_total: one("SELECT COUNT(*) AS c FROM send_logs WHERE status = 'sent'"),
    failed_total: one("SELECT COUNT(*) AS c FROM send_logs WHERE status = 'failed'"),
    sent_today: one(
      "SELECT COUNT(*) AS c FROM send_logs WHERE status = 'sent' AND date(created_at,'localtime') = date('now','localtime')",
    ),
    pending: one("SELECT COUNT(*) AS c FROM schedules WHERE status = 'pending' AND run_at > ?", now),
    overdue: one("SELECT COUNT(*) AS c FROM schedules WHERE status = 'pending' AND run_at <= ?", now),
    failed_schedules: one("SELECT COUNT(*) AS c FROM schedules WHERE status = 'failed'"),
    paused: one("SELECT COUNT(*) AS c FROM schedules WHERE status = 'paused'"),
    done: one("SELECT COUNT(*) AS c FROM schedules WHERE status = 'sent'"),
    today_remaining: one(
      "SELECT COUNT(*) AS c FROM schedules WHERE status = 'pending' AND substr(run_at,1,10) = ?",
      today,
    ),
  };

  const upcoming = db
    .prepare(
      `SELECT s.id, s.title, s.run_at, s.repeat_mode, s.status,
              (SELECT COUNT(*) FROM schedule_targets t WHERE t.schedule_id = s.id) AS target_count,
              (SELECT COUNT(*) FROM attachments a WHERE a.schedule_id = s.id) AS attachment_count
       FROM schedules s WHERE s.status = 'pending' ORDER BY s.run_at ASC LIMIT 10`,
    )
    .all();

  const pendingAttachments = db
    .prepare(
      `SELECT a.id, a.file_name, a.size, a.stored_name, s.id AS schedule_id, s.title, s.run_at, s.status
       FROM attachments a JOIN schedules s ON s.id = a.schedule_id
       WHERE s.status IN ('pending','paused','failed','sending')
       ORDER BY s.run_at ASC LIMIT 100`,
    )
    .all()
    .map((a) => ({
      id: a.id,
      file_name: a.file_name,
      size: a.size,
      schedule_id: a.schedule_id,
      title: a.title,
      run_at: a.run_at,
      status: a.status,
      missing: !fs.existsSync(path.join(UPLOAD_DIR, a.stored_name)),
    }));

  res.json({
    summary,
    upcoming,
    pending_attachments: pendingAttachments,
    wa: wa.getStatus().status,
    last_tick: scheduler.getLastTick(),
    catchup_hours: Number(getSetting("catchup_hours", "12")),
    server_time: now,
  });
});

module.exports = router;
