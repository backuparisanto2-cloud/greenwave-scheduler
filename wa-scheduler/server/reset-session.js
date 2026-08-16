// Hapus sesi WhatsApp lokal agar bisa scan QR ulang: npm run reset-session
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "data", "wa-session");
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("[reset] sesi WhatsApp dihapus. Jalankan npm start lalu scan QR lagi.");
} else {
  console.log("[reset] tidak ada sesi tersimpan.");
}
