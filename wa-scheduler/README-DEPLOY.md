# Tutorial Deploy & Penggunaan — WhatsApp Scheduler

Aplikasi ini berjalan 100% di PC Windows 10 Anda. Semua data — jadwal, kontak, lampiran, dan sesi WhatsApp — disimpan lokal di folder `data/`. Tidak ada data yang dikirim ke server luar.

---

## Persiapan sistem (sekali saja)

1. **Install Node.js 20 LTS**
   - Unduh dari <https://nodejs.org> (pilih **LTS**, installer `.msi` 64-bit).
   - Saat instalasi, biarkan opsi **"Add to PATH"** tetap tercentang.

2. **Install Google Chrome** (disarankan)
   - Unduh dari <https://www.google.com/chrome>.
   - Jika Chrome tidak terinstall, Puppeteer akan mengunduh Chromium sendiri saat `npm install`.

3. **Verifikasi instalasi**
   - Buka **Command Prompt** (tombol Windows → ketik `cmd` → Enter).
   - Jalankan:

     ```bat
     node -v
     npm -v
     ```

   - Harus muncul versi, misalnya:

     ```text
     v20.17.0
     10.8.0
     ```

---

## Menyiapkan aplikasi

1. Salin atau ekstrak folder `wa-scheduler` ke lokasi permanen, misalnya:

   ```text
   C:\wa-scheduler
   ```

2. Buka folder tersebut di Command Prompt:

   ```bat
   cd C:\wa-scheduler
   ```

3. Install dependency (butuh koneksi internet, ±3–5 menit, sekaligus mengunduh Chromium):

   ```bat
   npm install
   ```

4. Build frontend dan jalankan server:

   ```bat
   npm run build
   npm start
   ```

5. Jika berhasil, terminal menampilkan:

   ```text
   WhatsApp Scheduler siap
   Buka di browser : http://localhost:3000
   ```

> **Jangan tutup jendela Command Prompt.** Selama jendela ini terbuka, penjadwal aktif.

---

## Login dan scan QR code

1. Buka browser dan akses <http://localhost:3000>.
2. Login dengan akun default:
   - **Email:** `arisanto@mentarisatria.net.id`
   - **Password:** `Backmeup2023`
3. Masuk ke menu **Koneksi**, tunggu QR code muncul (biasanya 5–20 detik pertama kali).
4. Di HP Anda: buka **WhatsApp → Menu (⋮) → Perangkat Tertaut → Tautkan Perangkat**, lalu scan QR code di layar PC.
5. Status berubah menjadi **Terhubung**. Sesi tersimpan secara lokal, jadi restart berikutnya tidak perlu scan ulang.

> **Penting:** Ganti password lewat menu **Pengaturan** setelah login pertama.

---

## Membuat jadwal pengiriman

1. Klik menu **Jadwal Baru**.
2. Isi **judul** dan **isi pesan**. Gunakan `{nama}` agar otomatis diganti dengan nama kontak saat broadcast.
3. Lampirkan file bila perlu (maksimal 5 file, 25 MB per file — gambar, PDF, Word, Excel, dll).
4. Pilih tujuan:
   - **Nomor** — ketik satu atau beberapa nomor dipisah koma. Nomor diawali `08123…` akan otomatis dikonversi ke format internasional `628123…`.
   - **Grup** — pilih dari daftar grup (muncul setelah WhatsApp terhubung).
   - **Kontak / CSV** — pilih dari kontak hasil impor CSV.
5. Tentukan **tanggal & jam** pengiriman, serta mode pengulangan:
   - **Sekali** — kirim satu kali pada waktu yang ditentukan.
   - **Harian** — kirim setiap hari pada jam yang sama.
   - **Mingguan** — pilih hari (Senin–Minggu, bisa lebih dari satu).
   - **Bulanan** — pilih tanggal (1–31).
6. Klik **Simpan**. Penjadwal mengecek setiap menit dan mengirim tepat waktu.

---

## Broadcast dengan CSV

1. Klik menu **Kontak / CSV**.
2. Impor file CSV dengan format:

   ```csv
   nama,nomor
   Budi,08123456789
   Sinta,081298765432
   ```

3. Saat membuat jadwal, pilih tujuan **Kontak / CSV** dan pilih kontak yang sudah diimpor.
4. Gunakan `{nama}` di isi pesan untuk personalisasi otomatis.
5. Broadcast diberi jeda acak 3–8 detik antar nomor agar lebih aman dari pemblokiran WhatsApp.

---

## Menjalankan otomatis saat Windows menyala (opsional)

### Cara cepat via folder Startup

1. Buat file `start-wa.bat` di `C:\wa-scheduler` dengan isi:

   ```bat
   @echo off
   cd /d C:\wa-scheduler
   npm start
   ```

2. Tekan `Win + R` → ketik `shell:startup` → Enter.
3. Salin *shortcut* file `start-wa.bat` ke folder Startup tersebut.

### Cara via Task Scheduler

1. Buka **Task Scheduler** → **Create Task**.
2. Tab **Triggers** → **New** → pilih **At log on**.
3. Tab **Actions** → **New** → **Start a program**.
4. Program: `C:\wa-scheduler\start-wa.bat`.
5. **Start in:** `C:\wa-scheduler`.
6. Centang **Run with highest privileges** → OK.

---

## Perintah berguna

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan aplikasi |
| `npm run build` | Build ulang frontend setelah ada perubahan UI |
| `npm run reset-session` | Hapus sesi WhatsApp dan scan QR ulang |
| `set PORT=4000 && npm start` | Jalankan di port lain (contoh: 4000) |
| `set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe && npm start` | Paksa menggunakan Chrome tertentu |

---

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `EADDRINUSE :3000` | Port 3000 dipakai aplikasi lain. Jalankan dengan port lain: `set PORT=4000 && npm start`. |
| QR code tidak muncul / loading terus | Tutup aplikasi (`Ctrl + C`), jalankan `npm run reset-session`, lalu `npm start`. |
| `Failed to launch the browser process` | Set environment variable `CHROME_PATH` ke lokasi `chrome.exe` (lihat tabel perintah). |
| Pesan tidak terkirim | Pastikan status menu **Koneksi** = **Terhubung**, dan HP utama tetap online sesekali. |
| `better-sqlite3` gagal build | Install **Visual C++ Build Tools**, atau pastikan menggunakan Node.js 20 LTS (bukan versi ganjil/terbaru). |
| Lupa password dashboard | Hapus file `data/scheduler.db` (jadwal dan kontak ikut hilang), lalu `npm start` untuk membuat akun default ulang. |

---

## Backup dan pemindahan

- Folder `data/` berisi database, lampiran, dan sesi WhatsApp.
- Untuk backup: salin seluruh folder `data/` ke lokasi aman.
- Untuk pindah ke PC lain: install ulang di PC baru (langkah 1–2), lalu timpa folder `data/` dengan backup.

---

## Catatan penting

- whatsapp-web.js adalah klien tidak resmi yang mengendalikan WhatsApp Web. Hindari mengirim pesan massal dalam jumlah besar/cepat agar nomor tidak dibatasi atau diblokir WhatsApp.
- Server aplikasi secara default hanya bisa diakses dari komputer lokal (`127.0.0.1`). Jangan membuka port 3000 ke internet.
- Ganti password default segera setelah login pertama melalui menu **Pengaturan**.
