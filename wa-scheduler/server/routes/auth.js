const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const { db } = require("../db");

const sessions = new Map(); // token -> { userId, email, expires }
const TTL = 1000 * 60 * 60 * 12;

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, email: user.email, expires: Date.now() + TTL });
  return token;
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.sid;
  const s = token && sessions.get(token);
  if (!s || s.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Belum login" });
  }
  s.expires = Date.now() + TTL;
  req.user = { id: s.userId, email: s.email };
  next();
}

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });

router.post("/login", loginLimiter, (req, res) => {
  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Input tidak valid" });

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(parsed.data.email.toLowerCase());
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ error: "Email atau password salah" });
  }
  const token = createSession(user);
  res.cookie("sid", token, { httpOnly: true, sameSite: "lax", maxAge: TTL });
  res.json({ email: user.email });
});

router.post("/logout", (req, res) => {
  const token = req.cookies && req.cookies.sid;
  if (token) sessions.delete(token);
  res.clearCookie("sid");
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => res.json({ email: req.user.email }));

router.post("/password", requireAuth, (req, res) => {
  const parsed = z
    .object({ current: z.string().min(1), next: z.string().min(8) })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Password baru minimal 8 karakter" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!bcrypt.compareSync(parsed.data.current, user.password_hash)) {
    return res.status(401).json({ error: "Password lama salah" });
  }
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    bcrypt.hashSync(parsed.data.next, 10),
    user.id,
  );
  res.json({ ok: true });
});

module.exports = { router, requireAuth };
