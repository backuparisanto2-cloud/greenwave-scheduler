// Frontend sudah berupa file statis siap pakai di folder public/,
// jadi tidak ada langkah kompilasi. Skrip ini hanya memeriksa kelengkapan file.
const fs = require("fs");
const path = require("path");

const required = ["index.html", "app.js", "styles.css"];
const dir = path.join(__dirname, "..", "public");
const missing = required.filter((f) => !fs.existsSync(path.join(dir, f)));

if (missing.length) {
  console.error("[build] file frontend hilang:", missing.join(", "));
  process.exit(1);
}
console.log("[build] frontend siap. Jalankan: npm start");
