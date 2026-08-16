# Tutorial Deploy & Penggunaan WhatsApp Scheduler

Membuat tutorial lengkap dalam bahasa Indonesia yang menjelaskan cara menyiapkan dan menjalankan aplikasi WhatsApp Scheduler lokal di Windows 10, serta menampilkannya di halaman web proyek Lovable.

## Tujuan
- Memperbarui `wa-scheduler/README-DEPLOY.md` agar lebih rapi, konsisten, dan mudah diikuti.
- Menambah halaman `/tutorial` di proyek Lovable yang menyajikan langkah deploy & penggunaan dalam UI tema putih + soft green line yang sudah ada.
- Menerbitkan (publish) proyek Lovable setelah halaman tutorial selesai.

## Langkah pengerjaan

1. **Perbarui README-DEPLOY.md**
   - Rapikan struktur heading dan numbering.
   - Tambahkan ringkasan persiapan sistem di bagian atas.
   - Pastikan semua perintah Windows, credential default, dan troubleshooting tetap lengkap.
   - Tambahkan catatan keamanan lokal (server bind 127.0.0.1) dan saran backup.

2. **Buat halaman tutorial di Lovable**
   - Buat route baru `src/routes/tutorial.tsx` dengan `createFileRoute('/tutorial')`.
   - Tampilkan konten tutorial dalam beberapa bagian: Persiapan, Install, Login & QR, Membuat Jadwal, Broadcast CSV, Otomatis Startup, Troubleshooting.
   - Gunakan komponen React sederhana dengan styling Tailwind mengikuti palet putih + hijau lembut yang sudah dipakai di `src/routes/index.tsx`.
   - Tambahkan metadata `head()` unik untuk halaman tersebut.
   - Tambahkan link ke halaman tutorial dari halaman utama (`src/routes/index.tsx`).

3. **Verifikasi build**
   - Jalankan typecheck/build untuk memastikan route baru terdaftar dan tidak ada error.

4. **Publish proyek**
   - Setelah build bersih, publikasikan proyek ke URL Lovable agar tutorial bisa diakses publik.

## Hasil akhir
- `wa-scheduler/README-DEPLOY.md` yang lebih rapi dan lengkap.
- Halaman `/tutorial` di situs Lovable yang menjelaskan deploy & penggunaan.
- Proyek dipublikasikan dan URL publik siap dibagikan.
