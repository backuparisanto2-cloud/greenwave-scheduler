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

## Mengedit & menyalin jadwal

Di menu **Daftar Jadwal**, setiap jadwal punya tombol:

- **Edit** — membuka kembali form berisi data jadwal (judul, pesan, tujuan, waktu, pengulangan, lampiran). Lampiran lama bisa dihapus satu per satu lewat tanda `×`, dan Anda bisa menambah lampiran baru. Klik **Simpan perubahan** atau **Batal**.
- **Salin** — menduplikat jadwal beserta tujuan dan lampirannya. Salinan dibuat dalam status *dijeda* lalu langsung terbuka di form edit, sehingga Anda tinggal mengubah tanggal/jam (atau isi pesan) dan menekan **Simpan perubahan** untuk mengaktifkannya.
- **Kirim sekarang**, **Jeda / Lanjutkan**, dan **Hapus** tetap tersedia seperti biasa.

Daftar jadwal juga menampilkan ringkasan tujuan (nama + nomor) agar mudah dicek sebelum dikirim.

---

## Kontak (nama & nomor telepon)

1. Klik menu **Kontak / CSV**.
2. Tambah manual dengan mengisi **Nama** dan **Nomor**, atau impor file CSV dengan format:

   ```csv
   nama,nomor
   Budi,08123456789
   Sinta,081298765432
   ```

3. Setiap baris kontak punya tombol **Edit** untuk mengubah nama atau nomor langsung di tabel (klik **Simpan** / **Batal**), dan tombol **Hapus**.
4. Nomor otomatis dinormalisasi (hanya angka dan `+`); nomor yang sudah dipakai kontak lain akan ditolak.
5. Saat membuat jadwal, pilih tujuan **Kontak / CSV** lalu pilih kontak yang diinginkan — chip menampilkan nama beserta nomornya.
6. Gunakan `{nama}` di isi pesan untuk personalisasi otomatis.
7. Broadcast diberi jeda acak 3–8 detik antar nomor agar lebih aman dari pemblokiran WhatsApp.


---

## Autostart & auto-restart di Windows 10

Tujuan: aplikasi otomatis hidup saat Windows menyala, dan otomatis jalan kembali bila proses berhenti (crash, `Ctrl + C` tak sengaja, atau listrik mati lalu PC menyala lagi).

### 1. Auto-restart sederhana (batch loop)

Buat file `start-wa.bat` di `C:\wa-scheduler` dengan isi:

```bat
@echo off
title WhatsApp Scheduler
cd /d C:\wa-scheduler
:loop
call npm start
echo.
echo Aplikasi berhenti. Menjalankan ulang dalam 5 detik...
timeout /t 5 /nobreak >nul
goto loop
```

Jika `npm start` keluar karena error apa pun, skrip menunggu 5 detik lalu menjalankannya lagi otomatis. Untuk menghentikan permanen: tutup jendela Command Prompt-nya.

### 2. Autostart saat Windows menyala

**Cara A — folder Startup (paling mudah, butuh login user)**

1. Tekan `Win + R` → ketik `shell:startup` → Enter.
2. Klik kanan `start-wa.bat` → **Create shortcut**, lalu pindahkan shortcut itu ke folder Startup.

**Cara B — Task Scheduler (lebih tangguh, disarankan)**

1. Buka **Task Scheduler** → **Create Task** (bukan *Basic Task*).
2. Tab **General**: nama `WhatsApp Scheduler`, pilih **Run whether user is logged on or not**, centang **Run with highest privileges**.
3. Tab **Triggers** → **New** → **At startup**. Tambah satu trigger lagi: **At log on**.
   - Centang **Repeat task every 5 minutes** → for a duration of **Indefinitely** (opsional, sebagai jaring pengaman).
4. Tab **Actions** → **New** → **Start a program**
   - Program: `C:\wa-scheduler\start-wa.bat`
   - Start in: `C:\wa-scheduler`
5. Tab **Conditions**: hilangkan centang **Start the task only if the computer is on AC power**.
6. Tab **Settings**:
   - Centang **If the task fails, restart every** → `1 minute`, **Attempt to restart up to** → `999` times.
   - Hilangkan centang **Stop the task if it runs longer than**.
   - **If the task is already running**: pilih **Do not start a new instance**.
7. OK → masukkan password Windows bila diminta.

### 3. Pulih otomatis setelah listrik mati

1. **BIOS/UEFI** — masuk BIOS saat booting (biasanya `Del` / `F2`), cari opsi **Restore on AC Power Loss** / **AC Back** / **After Power Failure**, set ke **Power On** (atau **Last State**). Dengan ini PC menyala sendiri begitu listrik kembali.
2. **Matikan tidur otomatis** — Settings → System → Power & sleep → set **Sleep** ke **Never**. Untuk PC yang selalu online, nonaktifkan juga hibernate: buka Command Prompt sebagai Administrator lalu jalankan `powercfg /h off`.
3. **Nonaktifkan Fast Startup** (agar trigger *At startup* selalu jalan): Control Panel → Power Options → *Choose what the power buttons do* → *Change settings that are currently unavailable* → hilangkan centang **Turn on fast startup**.
4. **Windows Update** — atur **Active hours** agar Windows tidak restart di jam kerja pengiriman pesan.
5. Disarankan memakai **UPS** kecil agar PC mati dengan rapi saat listrik padam.

### 4. Opsi lanjutan: jalankan sebagai Windows Service (NSSM)

Cara paling stabil — aplikasi jalan tanpa jendela Command Prompt dan otomatis restart sendiri.

1. Unduh **NSSM** dari <https://nssm.cc/download>, ekstrak, lalu salin `nssm.exe` (versi `win64`) ke `C:\wa-scheduler`.
2. Buka Command Prompt **sebagai Administrator** di `C:\wa-scheduler`, jalankan:

   ```bat
   nssm install WAScheduler
   ```

3. Isi jendela NSSM:
   - **Path:** `C:\Program Files\nodejs\node.exe`
   - **Arguments:** `server/index.js`
   - **Startup directory:** `C:\wa-scheduler`
   - Tab **Details** → *Startup type*: **Automatic (Delayed Start)**
   - Tab **Exit actions** → *Restart application*, **Delay restart by** `5000` ms
   - Tab **I/O** → Output/Error: `C:\wa-scheduler\data\logs\service.log`
4. Klik **Install service**, lalu jalankan:

   ```bat
   nssm start WAScheduler
   ```

Perintah lain yang berguna:

| Perintah | Fungsi |
| --- | --- |
| `nssm restart WAScheduler` | Restart layanan |
| `nssm stop WAScheduler` | Hentikan layanan |
| `nssm edit WAScheduler` | Ubah konfigurasi |
| `nssm remove WAScheduler confirm` | Hapus layanan |

> Jalankan `npm run build` sekali sebelum memasang service, karena service memanggil `node server/index.js` langsung.

### 5. Verifikasi & troubleshooting autostart

- Restart PC, tunggu ±1 menit, lalu buka <http://localhost:3000>. Jika halaman login muncul, autostart berhasil.
- Task Scheduler → pilih task → tab **History** untuk melihat penyebab kegagalan.
- Untuk mode service, cek log di `C:\wa-scheduler\data\logs\service.log`.
- Sesi WhatsApp tersimpan di folder `data/`, jadi setelah restart **tidak perlu scan QR ulang**.
- Jadwal yang terlewat saat PC mati akan diproses kembali begitu aplikasi hidup (dengan batas toleransi).


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
