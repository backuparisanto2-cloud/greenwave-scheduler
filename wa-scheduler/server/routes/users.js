const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { db } = require("../db");
const { requireAdmin } = require("./auth");

const router = express.Router();
router.use(requireAdmin);

const countAdmins = () =>
  db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT id, email, role, created_at FROM users ORDER BY id ASC").all());
});

router.post("/", (req, res) => {
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["admin", "operator"]).default("operator"),
    })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Email valid & password minimal 8 karakter" });
  try {
    db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?,?,?)").run(
      parsed.data.email.toLowerCase(),
      bcrypt.hashSync(parsed.data.password, 10),
      parsed.data.role,
    );
  } catch (_) {
    return res.status(409).json({ error: "Email sudah terdaftar" });
  }
  res.status(201).json({ ok: true });
});

router.put("/:id", (req, res) => {
  const parsed = z
    .object({
      role: z.enum(["admin", "operator"]).optional(),
      password: z.string().min(8).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Data tidak valid" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan" });

  if (parsed.data.role && parsed.data.role !== user.role) {
    if (user.role === "admin" && countAdmins() <= 1) {
      return res.status(400).json({ error: "Minimal harus ada satu admin" });
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(parsed.data.role, user.id);
  }
  if (parsed.data.password) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      bcrypt.hashSync(parsed.data.password, 10),
      user.id,
    );
  }
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan" });
  if (user.id === req.user.id)
    return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" });
  if (user.role === "admin" && countAdmins() <= 1)
    return res.status(400).json({ error: "Minimal harus ada satu admin" });
  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  res.json({ ok: true });
});

module.exports = router;
