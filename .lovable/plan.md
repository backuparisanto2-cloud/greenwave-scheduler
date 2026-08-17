# Autostart & Auto-Restart di Windows 10

Menambah panduan agar WhatsApp Scheduler otomatis jalan saat Windows menyala dan otomatis hidup lagi jika aplikasi berhenti (crash, listrik mati lalu PC menyala kembali).

## Isi tutorial baru

1. **Auto-restart sederhana (batch loop)**
   - File `start-wa.bat` versi baru dengan loop: jika `npm start` keluar, tunggu 5 detik lalu jalankan ulang otomatis.
   - Cocok untuk pengguna awam, tanpa install tambahan.

2. **Autostart saat Windows menyala**
   - Cara A: shortcut `start-wa.bat` ke folder `shell:startup` (butuh login user).
   - Cara B: Task Scheduler dengan trigger **At startup** + **At log on**, opsi "Run whether user is logged on or not", "Restart the task if it fails" setiap 1 menit hingga 999 kali, dan "If the task is already running: Do not start a new instance".

3. **Pulih otomatis setelah listrik mati**
   - Aktifkan **Restore on AC/Power Loss** di BIOS/UEFI agar PC menyala sendiri saat listrik kembali.
   - Matikan Sleep/Hibernate di Power Options; nonaktifkan "Fast Startup" bila perlu.
   - Nonaktifkan restart otomatis Windows Update di luar jam kerja (Active Hours).

4. **Opsi lanjutan: jalankan sebagai Windows Service (NSSM)**
   - Unduh NSSM, `nssm install WAScheduler`, isi Path `node.exe`, Arguments `server/index.js`, Startup directory `C:\wa-scheduler`.
   - Tab Exit actions: Restart, delay 5000 ms. Startup type: Automatic (Delayed Start).
   - Perintah `nssm start/stop/restart/remove WAScheduler` dan lokasi log.

5. **Verifikasi & troubleshooting**
   - Cek `http://localhost:3000` setelah restart PC.
   - Task Scheduler → History untuk melihat kegagalan; log NSSM ke `data/logs/`.
   - Catatan: sesi WhatsApp tetap tersimpan di `data/`, jadi tidak perlu scan QR ulang setelah restart.

## Perubahan file

- `wa-scheduler/README-DEPLOY.md` — ganti bagian "Menjalankan otomatis saat Windows menyala" dengan bagian lengkap berisi 5 poin di atas.
- `src/routes/tutorial.tsx` — ganti section autostart lama dengan dua section baru: "Autostart & auto-restart" dan "Pulih otomatis setelah listrik mati", mengikuti gaya putih + hijau lembut yang ada.

Setelah itu build diverifikasi dan situs bisa dipublikasikan ulang.
