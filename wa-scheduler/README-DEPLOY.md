# Tutorial Deploy — WhatsApp Scheduler di Windows 10

Aplikasi ini berjalan 100% di PC Anda. Data (jadwal, kontak, lampiran, sesi WhatsApp)
disimpan lokal di folder `data/`. Tidak ada server luar.

---

## 1. Persiapan (sekali saja)

1. **Install Node.js 20 LTS** — unduh dari <https://nodejs.org> (pilih **LTS**, installer `.msi` 64-bit).
   Saat instalasi, biarkan opsi "Add to PATH" tetap tercentang.
2. **Install Google Chrome** (disarankan) — <https://www.google.com/chrome>.
   Jika Chrome tidak ada, Puppeteer akan mengunduh Chromium sendiri saat `npm install`.
3. Cek instalasi. Buka **Command Prompt** (tombol Windows → ketik `cmd`) lalu jalankan:

   ```bat
   node -v
   npm -v
   ```

   Harus muncul versi, misalnya `v20.17.0`.

---

## 2. Menyiapkan aplikasi

1. Salin/ekstrak folder `wa-scheduler` ke lokasi permanen, misalnya `C:\wa-scheduler`.
2. Buka folder tersebut di Command Prompt:

   ```bat
   cd C:\wa-scheduler
   ```

3. Install dependency (butuh internet, ±3–5 menit, mengunduh Chromium):

   ```bat
   npm install
   ```

4. Cek file frontend lalu jalankan:

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

## 3. Login & scan QR

1. Buka browser ke <http://localhost:3000>.
2. Login:
   - Email: `arisanto@mentarisatria.net.id`
   - Password: `Backmeup2023`
3. Masuk ke menu **Koneksi**, tunggu QR muncul (5–20 detik pertama kali).
4. Di HP: **WhatsApp → Menu (⋮) → Perangkat Tertaut → Tautkan Perangkat** → scan QR di layar.
5. Status berubah menjadi **Terhubung**. Sesi tersimpan, jadi restart berikutnya tidak perlu scan lagi.

> Ganti password lewat menu **Pengaturan** setelah login pertama.

---

## 4. Membuat jadwal

1. Menu **Jadwal Baru**.
2. Isi judul + isi pesan. Gunakan `{nama}` agar otomatis diganti nama kontak.
3. Lampirkan file bila perlu (maks 5 file, 25 MB per file — gambar, PDF, Word, Excel, dll).
4. Pilih tujuan:
   - **Nomor** — ketik satu atau beberapa nomor dipisah koma (`08123…` otomatis jadi `628123…`).
   - **Grup** — pilih dari daftar grup (muncul setelah WhatsApp terhubung).
   - **Kontak / CSV** — pilih dari kontak hasil impor CSV.
5. Tentukan **tanggal & jam** bebas, serta pengulangan: sekali / harian / mingguan (pilih hari) / bulanan.
6. Simpan. Penjadwal mengecek setiap menit dan mengirim tepat waktu.

**Impor CSV** (menu Kontak / CSV) — format file:

```csv
nama,nomor
Budi,08123456789
Sinta,081298765432
```

Broadcast diberi jeda acak 3–8 detik antar nomor agar aman dari pemblokiran WhatsApp.

---

## 5. Jalan otomatis saat Windows menyala (opsional)

1. Buat file `start-wa.bat` di `C:\wa-scheduler` berisi:

   ```bat
   @echo off
   cd /d C:\wa-scheduler
   npm start
   ```

2. Tekan `Win + R` → ketik `shell:startup` → Enter.
3. Salin *shortcut* `start-wa.bat` ke folder Startup tersebut.

Atau lewat **Task Scheduler**: Create Task → Trigger "At log on" → Action "Start a program" →
Program `C:\wa-scheduler\start-wa.bat` → Start in `C:\wa-scheduler` → centang "Run with highest privileges".

---

## 6. Perintah berguna

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan aplikasi |
| `npm run reset-session` | Hapus sesi WhatsApp, scan QR ulang |
| `set PORT=4000 && npm start` | Jalankan di port lain |
| `set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe && npm start` | Paksa pakai Chrome tertentu |

---

## 7. Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `EADDRINUSE :3000` | Port dipakai aplikasi lain. Jalankan `set PORT=4000 && npm start`. |
| QR tidak muncul / loading terus | Tutup aplikasi (`Ctrl + C`), jalankan `npm run reset-session`, lalu `npm start`. |
| `Failed to launch the browser process` | Set `CHROME_PATH` ke lokasi chrome.exe (lihat tabel di atas). |
| Pesan tidak terkirim | Cek menu **Koneksi** harus "Terhubung", dan HP utama tetap online sesekali. |
| `better-sqlite3` gagal build | Install **Visual C++ Build Tools**, atau pakai Node.js 20 LTS (bukan versi ganjil/terbaru). |
| Lupa password dashboard | Hapus `data/scheduler.db` (jadwal ikut hilang) lalu `npm start` untuk seed ulang akun default. |

---

## 8. Backup

Salin seluruh folder `data/` — berisi database, lampiran, dan sesi WhatsApp.
Untuk memindah ke PC lain: install ulang (langkah 1–2), lalu timpa folder `data/`.

---

## Catatan

whatsapp-web.js adalah klien tidak resmi (mengendalikan WhatsApp Web).
Hindari mengirim pesan massal dalam jumlah besar/cepat agar nomor tidak dibatasi WhatsApp.
