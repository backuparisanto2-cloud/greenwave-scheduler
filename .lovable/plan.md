# WhatsApp Scheduler — Aplikasi Lokal Windows 10

Aplikasi Node.js mandiri yang dijalankan di PC Windows 10 dengan `npm start`. Cukup scan QR code sekali, lalu bisa menjadwalkan pesan WhatsApp (teks + lampiran) ke nomor, grup, atau daftar CSV. Semua data tersimpan di SQLite lokal.

Karena whatsapp-web.js membutuhkan Node.js + Chrome di mesin lokal, kode ini dibuat sebagai proyek terpisah di dalam repo (folder `wa-scheduler/`) yang Anda unduh dan jalankan di PC — bukan di preview Lovable.

## Tampilan

- Tema putih bersih, aksen garis hijau lembut (soft elegant green), tipografi modern, sudut membulat.
- Responsif: sidebar di desktop, bottom-nav di mobile/tablet.
- Halaman: Login, Koneksi (QR), Jadwal Baru, Daftar Jadwal, Kontak/CSV, Riwayat & Log, Pengaturan.

## Fitur

1. **Login dashboard** — satu akun admin (arisanto@mentarisatria.net.id), password disimpan ter-hash (bcrypt), sesi cookie httpOnly. Password awal di-seed saat inisialisasi database dan bisa diubah di Pengaturan.
2. **Koneksi WhatsApp** — QR code tampil di halaman Koneksi, sesi disimpan lokal (LocalAuth) sehingga tidak perlu scan ulang setiap restart. Indikator status: terhubung / terputus / perlu scan.
3. **Jadwal sekali kirim** — pilih tujuan (nomor tunggal atau grup), isi pesan, pilih tanggal & jam bebas (datetime picker, zona waktu PC), lampirkan file (gambar, PDF, dokumen).
4. **Jadwal berulang** — harian, mingguan (pilih hari), bulanan (pilih tanggal), dengan jam kirim dan tanggal akhir opsional.
5. **Broadcast CSV** — impor file CSV berisi nomor + nama, preview & validasi nomor, kirim dengan jeda acak antar pesan agar aman.
6. **Riwayat** — status setiap pengiriman (terkirim / gagal / menunggu), pesan error, tombol kirim ulang.

## Detail teknis

- Runtime: Node.js 20 LTS, Express + whatsapp-web.js (LocalAuth, Puppeteer/Chromium).
- Penjadwal: `node-cron` tick tiap menit membaca job jatuh tempo dari database; job berulang menghitung jadwal berikutnya setelah sukses. Job yang terlewat saat PC mati akan diproses saat aplikasi hidup kembali (dengan batas toleransi).
- Database: `better-sqlite3`, file `data/scheduler.db`. Tabel: `users`, `schedules`, `schedule_targets`, `attachments`, `send_logs`, `contacts`.
- Lampiran disimpan di `data/uploads/` (upload via multer), direferensikan dari tabel `attachments`.
- Frontend: halaman React yang di-build ke `public/` dan dilayani Express, jadi seluruh aplikasi jalan dari satu perintah `npm start` di `http://localhost:3000`.
- Keamanan lokal: server hanya bind ke `127.0.0.1`, rate limit login, validasi input dengan Zod.

## Struktur folder

```text
wa-scheduler/
  package.json
  server/
    index.js          Express + static + API
    wa-client.js      whatsapp-web.js + QR + status
    scheduler.js      cron tick, eksekusi & retry
    db.js             skema SQLite + seed admin
    routes/           auth, schedules, contacts, uploads
  web/                sumber UI React (tema putih + hijau)
  data/               scheduler.db, uploads/, sesi WhatsApp
  README-DEPLOY.md    tutorial instalasi Windows 10
```

## Tutorial deploy (isi README-DEPLOY.md)

1. Install Node.js 20 LTS dan Google Chrome di Windows 10.
2. Ekstrak folder `wa-scheduler`, buka Command Prompt di folder tersebut.
3. `npm install` (mengunduh Chromium untuk Puppeteer).
4. `npm run build` lalu `npm start`.
5. Buka `http://localhost:3000`, login dengan akun admin.
6. Buka menu Koneksi, scan QR dengan WhatsApp di HP (Perangkat Tertaut).
7. Buat jadwal pertama.
8. Opsional: jalankan otomatis saat Windows menyala via Task Scheduler (langkah rinci disertakan), plus tips troubleshooting (port bentrok, Chrome tidak ditemukan, sesi kadaluarsa, backup file `data/`).

## Catatan penting

- Preview Lovable tidak bisa menjalankan WhatsApp; halaman utama proyek Lovable akan menampilkan halaman panduan singkat + link ke tutorial deploy, sementara aplikasi sebenarnya dijalankan di PC Anda.
- whatsapp-web.js adalah klien tidak resmi; hindari volume broadcast berlebihan agar nomor tidak diblokir WhatsApp.
- Password yang Anda kirim di chat sebaiknya diganti setelah login pertama.
