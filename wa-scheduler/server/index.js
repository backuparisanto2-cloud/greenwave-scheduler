const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { db } = require("./db");
const wa = require("./wa-client");
const scheduler = require("./scheduler");
const { router: authRouter, requireAuth } = require("./routes/auth");
const schedulesRouter = require("./routes/schedules");
const contactsRouter = require("./routes/contacts");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/contacts", contactsRouter);

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
