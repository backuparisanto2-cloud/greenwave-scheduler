const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { db, getSetting, setSetting } = require("./db");
const wa = require("./wa-client");
const scheduler = require("./scheduler");
const { router: authRouter, requireAuth, requireAdmin } = require("./routes/auth");
const schedulesRouter = require("./routes/schedules");
const contactsRouter = require("./routes/contacts");
const usersRouter = require("./routes/users");
const statsRouter = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);
app.use("/api/stats", statsRouter);

app.get("/api/settings", requireAuth, (req, res) =>
  res.json({ catchup_hours: Number(getSetting("catchup_hours", "12")) }),
);

app.put("/api/settings", requireAdmin, (req, res) => {
  const h = Number(req.body && req.body.catchup_hours);
  if (!Number.isFinite(h) || h < 1 || h > 168)
    return res.status(400).json({ error: "Toleransi 1–168 jam" });
  setSetting("catchup_hours", Math.round(h));
  res.json({ ok: true });
});

app.get("/api/wa/status", requireAuth, (req, res) => res.json(wa.getStatus()));


app.get("/api/wa/groups", requireAuth, async (req, res) => {
  try {
    res.json(await wa.listGroups());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/wa/logout", requireAuth, async (req, res) => {
  await wa.logout();
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..", "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log("");
  console.log("  WhatsApp Scheduler siap");
  console.log(`  Buka di browser : http://localhost:${PORT}`);
  console.log("");
  wa.start();
  scheduler.start();
});
