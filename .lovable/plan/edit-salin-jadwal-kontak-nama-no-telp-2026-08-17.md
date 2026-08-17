# Edit & Salin Jadwal + Kontak (Nama & No. Telp)

Menambah kemampuan mengubah dan menyalin jadwal yang sudah dibuat, serta melengkapi pengelolaan kontak (nama + nomor telepon) di aplikasi lokal `wa-scheduler/`.

## Yang akan dibuat

### 1. Edit jadwal
- Tombol **Edit** pada setiap kartu di Daftar Jadwal.
- Membuka form "Jadwal Baru" yang sudah terisi: judul, pesan, tujuan (nomor/grup/kontak), mode ulang, hari/tanggal, jam kirim, tanggal akhir.
- Lampiran lama ditampilkan dengan tombol hapus; bisa menambah lampiran baru.
- Tombol berubah jadi **Simpan perubahan** + **Batal**.

### 2. Salin (duplikat) jadwal
- Tombol **Salin** pada setiap kartu: membuat jadwal baru berisi data yang sama (judul diberi akhiran "(salinan)"), status `pending`, waktu kirim default digeser ke waktu berikutnya, lampiran ikut disalin sebagai file baru.
- Setelah disalin, langsung dibuka di form edit agar tanggal/jam bisa disesuaikan.

### 3. Kontak: nama + nomor telepon
- Kolom nama dan nomor sudah ada; ditambahkan tombol **Edit** per baris untuk mengubah nama/nomor.
- Validasi nomor duplikat saat edit, normalisasi format nomor (hanya angka dan `+`).
- Kolom nama ditampilkan di daftar tujuan jadwal supaya jelas siapa penerimanya.

## Detail teknis

- `server/routes/schedules.js`:
  - `PUT /api/schedules/:id` — update field jadwal, ganti isi `schedule_targets`, hapus lampiran yang ditandai, tambah lampiran baru (multer, sama seperti POST).
  - `POST /api/schedules/:id/duplicate` — salin baris jadwal + target, copy file lampiran di `data/uploads/` dengan nama baru, kembalikan jadwal baru.
- `server/routes/contacts.js`:
  - `PUT /api/contacts/:id` — validasi Zod (nama opsional, nomor min 6 digit), tangani konflik UNIQUE dengan 409.
- `public/app.js`:
  - State form ditambah `editingId` dan daftar `keepAttachments`; fungsi submit memilih POST atau PUT.
  - Fungsi pengisi form dari objek jadwal (termasuk memilih ulang chip target dan kontak).
  - Tombol Edit/Salin di kartu jadwal, tombol Edit di tabel kontak (inline atau prompt sederhana sesuai gaya UI saat ini).
- `public/styles.css`: gaya tombol sekunder kecil pada kartu jadwal dan baris kontak, mengikuti tema putih + garis hijau lembut.
- `README-DEPLOY.md` dan halaman `/tutorial`: tambahkan langkah singkat cara mengedit dan menyalin jadwal.
