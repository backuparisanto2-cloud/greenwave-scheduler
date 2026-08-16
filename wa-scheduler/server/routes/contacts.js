const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { db } = require("../db");
const { requireAuth } = require("./auth");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM contacts ORDER BY name ASC").all());
});

router.post("/", (req, res) => {
  const parsed = z
    .object({ name: z.string().default(""), phone: z.string().min(6) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Nomor tidak valid" });
  try {
    db.prepare("INSERT INTO contacts (name, phone) VALUES (?,?)").run(
      parsed.data.name,
      parsed.data.phone.replace(/[^\d+]/g, ""),
    );
  } catch (_) {
    return res.status(409).json({ error: "Nomor sudah ada" });
  }
  res.status(201).json({ ok: true });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Impor CSV: kolom "nama,nomor" atau "name,phone" (header opsional)
router.post("/import", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File CSV wajib diisi" });
  const text = req.file.buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const ins = db.prepare("INSERT OR IGNORE INTO contacts (name, phone) VALUES (?,?)");

  let imported = 0;
  let skipped = 0;
  lines.forEach((line, i) => {
    const cols = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /nama|name|nomor|phone/i.test(line) && !/\d{6,}/.test(line)) return;
    let name = cols[0] || "";
    let phone = cols[1] || "";
    if (/^\+?\d[\d\s-]{5,}$/.test(name) && !phone) {
      phone = name;
      name = "";
    }
    phone = phone.replace(/[^\d+]/g, "");
    if (phone.length < 6) {
      skipped++;
      return;
    }
    const r = ins.run(name, phone);
    if (r.changes) imported++;
    else skipped++;
  });

  res.json({ imported, skipped });
});

module.exports = router;
