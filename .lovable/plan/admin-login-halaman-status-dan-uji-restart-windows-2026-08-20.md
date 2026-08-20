# Admin Login, Halaman Status, dan Uji Restart Windows

Tiga penambahan pada aplikasi lokal `wa-scheduler/`.

## 1. Login admin & pembatasan akses

Saat ini semua akun yang login punya akses penuh. Ditambahkan peran (role):

- Tabel `users` mendapat kolom `role` (`admin` | `operator`), default `operator`.
- Akun `arisanto@mentarisatria.net.id` di-seed sebagai `admin`.
- Halaman **Pengaturan** (khusus admin) mendapat panel *Kelola Pengguna*: tambah pengguna baru (email, password, peran), ubah peran, reset password, hapus pengguna. Admin terakhir tidak bisa dihapus/diturunkan.
- Semua pengguna tetap bisa: Koneksi (QR), Status, Riwayat, dan ganti password sendiri.
- Hanya admin bisa: Jadwal Baru, Daftar Jadwal (edit/salin/hapus/kirim sekarang), Kontak, dan Kelola Pengguna.
- Pembatasan dipasang di dua sisi: menu non-admin disembunyikan di UI, dan seluruh endpoint `/api/schedules/*`, `/api/contacts/*`, `/api/users/*` dijaga middleware `requireAdmin` (403 bila bukan admin) — jadi tidak bisa ditembus lewat API langsung.

## 2. Halaman Status Jadwal

Menu baru **Status** (ikon grafik) di posisi pertama setelah Koneksi, berisi:

- Kartu ringkasan: **Terkirim** (total log sukses), **Tertunda** (jadwal `pending` yang belum jatuh tempo), **Terlambat** (pending tapi waktunya sudah lewat), **Gagal**, **Dijeda**.
- Ringkasan hari ini: terkirim hari ini vs jadwal tersisa hari ini.
- Tabel **Jadwal berikutnya** (10 terdekat): judul, tujuan, waktu kirim, jumlah lampiran.
- Tabel **Lampiran belum terkirim**: semua file pada jadwal berstatus pending/paused/failed — nama file, ukuran, jadwal induk, waktu kirim, plus penanda merah bila file fisiknya hilang dari `data/uploads/`.
- Indikator koneksi WhatsApp + waktu tick scheduler terakhir, auto-refresh tiap 15 detik.

Backend: endpoint baru `GET /api/stats` yang menghitung semua angka di atas langsung dari SQLite.

## 3. Tahan restart komputer

Agar setelah deploy ulang dan restart PC WhatsApp tetap terhubung dan jadwal jalan:

- Sesi WhatsApp memang sudah persisten (`LocalAuth` di `data/wa-session`), tapi ditambahkan **auto-reconnect**: bila client `disconnected`, coba inisialisasi ulang otomatis (backoff 10 detik, maksimal berulang) dan catat di log.
- **Catch-up jadwal terlewat** saat aplikasi hidup kembali: jadwal `pending` yang waktunya lewat selama PC mati akan dikirim saat start (dengan batas toleransi yang bisa diatur di Pengaturan, default 12 jam; yang lebih lama ditandai `failed` dengan keterangan "terlewat saat PC mati" agar tidak mengirim pesan basi).
- Script `start-wa.bat` + Task Scheduler (sudah ada di README) diverifikasi ulang dan ditambah langkah **checklist uji restart** di README dan halaman `/tutorial`: restart PC → buka `http://localhost:3000` → cek badge "Terhubung" tanpa scan ulang → cek halaman Status untuk memastikan jadwal berikutnya masih terdaftar.

## Detail teknis

- `server/db.js`: migrasi aman `ALTER TABLE users ADD COLUMN role` (dicek dulu via `PRAGMA table_info`), set admin untuk email seed, plus tabel `settings` untuk toleransi catch-up.
- `server/routes/auth.js`: sertakan `role` di sesi dan `/me`; ekspor `requireAdmin`; router `users.js` baru untuk CRUD pengguna (hash bcrypt).
- `server/routes/stats.js`: query agregat untuk kartu, jadwal berikutnya, dan lampiran belum terkirim (join `attachments` + `schedules`, cek `fs.existsSync`).
- `server/wa-client.js`: handler `disconnected` dengan re-init terjadwal; expose `lastTick` dari `scheduler.js`.
- `public/app.js` + `styles.css`: menu dinamis berbasis role, halaman Status, panel Kelola Pengguna.
- `README-DEPLOY.md` dan `src/routes/tutorial.tsx`: bagian peran pengguna, halaman Status, dan checklist uji restart.
