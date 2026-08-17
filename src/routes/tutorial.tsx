import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial Deploy & Penggunaan — WhatsApp Scheduler" },
      {
        name: "description",
        content:
          "Panduan lengkap install, login, scan QR, membuat jadwal, broadcast CSV, dan troubleshooting WhatsApp Scheduler di Windows 10.",
      },
      { property: "og:title", content: "Tutorial Deploy & Penggunaan — WhatsApp Scheduler" },
      {
        property: "og:description",
        content:
          "Panduan lengkap install, login, scan QR, membuat jadwal, broadcast CSV, dan troubleshooting WhatsApp Scheduler di Windows 10.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TutorialPage,
});

const steps = [
  {
    n: "1",
    t: "Install Node.js 20 LTS",
    d: "Unduh dari nodejs.org, biarkan opsi Add to PATH tercentang. Lalu install Google Chrome (disarankan).",
  },
  {
    n: "2",
    t: "npm install",
    d: "Buka Command Prompt di folder wa-scheduler, jalankan npm install (±3–5 menit, mengunduh Chromium).",
  },
  {
    n: "3",
    t: "npm run build && npm start",
    d: "Aplikasi siap di http://localhost:3000. Jangan tutup jendela Command Prompt.",
  },
  {
    n: "4",
    t: "Login dan scan QR",
    d: "Login dengan akun default, masuk menu Koneksi, scan QR lewat WhatsApp → Perangkat Tertaut.",
  },
  {
    n: "5",
    t: "Buat jadwal",
    d: "Pilih tujuan, tanggal & jam bebas, lampirkan file, atur pengulangan harian/mingguan/bulanan.",
  },
];

const sections = [
  {
    title: "Persiapan sistem",
    body: [
      "Install Node.js 20 LTS dari nodejs.org (installer .msi 64-bit). Pastikan opsi Add to PATH tercentang.",
      "Install Google Chrome. Jika belum ada, Puppeteer akan mengunduh Chromium saat npm install.",
      "Verifikasi di Command Prompt: node -v dan npm -v harus menampilkan versi.",
    ],
  },
  {
    title: "Menyiapkan aplikasi",
    body: [
      "Ekstrak folder wa-scheduler ke lokasi permanen, misalnya C:\\wa-scheduler.",
      "Buka Command Prompt di folder tersebut, jalankan npm install.",
      "Jalankan npm run build lalu npm start. Server aktif di http://localhost:3000.",
    ],
  },
  {
    title: "Login dan scan QR",
    body: [
      "Buka browser ke http://localhost:3000.",
      "Email: arisanto@mentarisatria.net.id — Password: Backmeup2023",
      "Masuk menu Koneksi, tunggu QR code, lalu scan dari WhatsApp HP Anda.",
      "Setelah status Terhubung, sesi tersimpan lokal dan restart tidak perlu scan ulang.",
      "Ganti password default lewat menu Pengaturan setelah login pertama.",
    ],
  },
  {
    title: "Membuat jadwal pengiriman",
    body: [
      "Menu Jadwal Baru → isi judul dan pesan. Gunakan {nama} untuk personalisasi otomatis.",
      "Lampirkan file bila perlu (maks 5 file, 25 MB per file).",
      "Pilih tujuan: Nomor (pisah koma), Grup, atau Kontak/CSV.",
      "Tentukan tanggal & jam, lalu pilih pengulangan: Sekali, Harian, Mingguan, atau Bulanan.",
      "Simpan. Penjadwal mengecek setiap menit dan mengirim tepat waktu.",
    ],
  },
  {
    title: "Mengedit & menyalin jadwal",
    body: [
      "Menu Daftar Jadwal → tombol Edit membuka form berisi data jadwal (judul, pesan, tujuan, waktu, pengulangan, lampiran).",
      "Lampiran lama bisa dihapus lewat tanda × dan lampiran baru bisa ditambahkan, lalu klik Simpan perubahan atau Batal.",
      "Tombol Salin menduplikat jadwal beserta tujuan dan lampirannya; salinan dibuat dalam status dijeda dan langsung terbuka di form edit.",
      "Ubah tanggal/jam salinan lalu Simpan perubahan untuk mengaktifkannya.",
    ],
  },
  {
    title: "Kontak (nama & nomor) dan broadcast CSV",
    body: [
      "Menu Kontak / CSV → tambah manual dengan kolom Nama dan Nomor, atau impor file dengan format: nama,nomor.",
      "Setiap baris kontak punya tombol Edit untuk mengubah nama/nomor langsung di tabel, serta tombol Hapus.",
      "Saat membuat jadwal pilih tujuan Kontak/CSV; chip menampilkan nama beserta nomor kontak.",
      "Sistem memberi jeda acak 3–8 detik antar nomor agar lebih aman.",
    ],
  },

  {
    title: "Autostart & auto-restart di Windows 10",
    body: [
      "Buat start-wa.bat berisi loop: @echo off / cd /d C:\\wa-scheduler / :loop / call npm start / timeout /t 5 /nobreak >nul / goto loop — aplikasi otomatis jalan lagi bila berhenti.",
      "Cara mudah: Win + R → shell:startup → salin shortcut start-wa.bat ke folder Startup.",
      "Cara tangguh: Task Scheduler → Create Task, centang Run whether user is logged on or not + Run with highest privileges.",
      "Triggers: tambahkan At startup dan At log on. Actions: Start a program → C:\\wa-scheduler\\start-wa.bat, Start in C:\\wa-scheduler.",
      "Settings: If the task fails, restart every 1 minute, up to 999 times; If the task is already running → Do not start a new instance; hapus centang Stop the task if it runs longer than.",
    ],
  },
  {
    title: "Pulih otomatis setelah listrik mati",
    body: [
      "Di BIOS/UEFI aktifkan Restore on AC Power Loss (atau After Power Failure) = Power On agar PC menyala sendiri saat listrik kembali.",
      "Settings → System → Power & sleep → Sleep: Never. Untuk server 24 jam jalankan juga powercfg /h off sebagai Administrator.",
      "Nonaktifkan Fast Startup di Control Panel → Power Options agar trigger At startup selalu berjalan.",
      "Atur Active hours Windows Update supaya restart otomatis tidak terjadi di jam pengiriman pesan.",
      "Sesi WhatsApp tersimpan di folder data/, jadi setelah PC menyala kembali tidak perlu scan QR ulang.",
    ],
  },
  {
    title: "Opsi lanjutan: jalankan sebagai Windows Service (NSSM)",
    body: [
      "Unduh NSSM dari nssm.cc, salin nssm.exe ke C:\\wa-scheduler, lalu jalankan nssm install WAScheduler sebagai Administrator.",
      "Path: C:\\Program Files\\nodejs\\node.exe — Arguments: server/index.js — Startup directory: C:\\wa-scheduler.",
      "Details → Startup type: Automatic (Delayed Start). Exit actions → Restart application, delay 5000 ms.",
      "I/O → arahkan output & error ke C:\\wa-scheduler\\data\\logs\\service.log untuk memantau masalah.",
      "Kelola dengan nssm start / restart / stop / remove WAScheduler. Jalankan npm run build sekali sebelum memasang service.",
      "Verifikasi: restart PC, tunggu ±1 menit, buka http://localhost:3000.",
    ],
  },

  {
    title: "Troubleshooting",
    body: [
      "EADDRINUSE :3000 → jalankan dengan port lain: set PORT=4000 && npm start.",
      "QR tidak muncul → npm run reset-session lalu npm start.",
      "Failed to launch browser → set CHROME_PATH ke lokasi chrome.exe.",
      "Pesan tidak terkirim → cek status Koneksi harus Terhubung dan HP utama online.",
      "Lupa password → hapus data/scheduler.db lalu npm start untuk seed ulang.",
    ],
  },
  {
    title: "Backup",
    body: [
      "Salin seluruh folder data/ — berisi database, lampiran, dan sesi WhatsApp.",
      "Untuk pindah ke PC lain: install ulang, lalu timpa folder data/ dengan backup.",
    ],
  },
];

function TutorialPage() {
  return (
    <div className="min-h-screen bg-white text-[#16241d]">
      <header className="border-b border-[#dcece2]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-[9px] bg-gradient-to-br from-[#2f9e6b] to-[#1f6b4a] text-white">
              ●
            </div>
            <div className="leading-tight">
              <strong className="text-[15px]">WhatsApp Scheduler</strong>
              <span className="block text-[11px] text-[#6b8177]">Penjadwal pesan lokal</span>
            </div>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-[#1f6b4a] hover:text-[#2f9e6b]"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="border-b border-[#dcece2] py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8fcfae] bg-[#e7f4ec] px-3 py-1 text-xs font-semibold text-[#1f6b4a]">
            Panduan lengkap
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tutorial deploy & penggunaan
          </h1>
          <p className="mt-3 max-w-2xl text-[#6b8177]">
            Panduan step-by-step menyiapkan WhatsApp Scheduler di Windows 10: install, login, scan QR,
            membuat jadwal, broadcast CSV, troubleshooting, dan backup.
          </p>
        </section>

        <section className="border-b border-[#dcece2] py-12">
          <h2 className="text-xl font-semibold">Langkah cepat</h2>
          <ol className="mt-5 space-y-3">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-[14px] border border-[#dcece2] bg-white p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e7f4ec] text-sm font-semibold text-[#1f6b4a]">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{s.t}</h3>
                  <p className="mt-0.5 text-sm text-[#6b8177]">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-10 py-12">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-xl font-semibold">{sec.title}</h2>
              <ul className="mt-3 space-y-2">
                {sec.body.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[#6b8177]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fcfae]" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#dcece2] bg-[#fbfdfc] p-6">
          <h2 className="text-lg font-semibold">Catatan penting</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#6b8177]">
            <li>• whatsapp-web.js adalah klien tidak resmi. Hindari broadcast massal berlebihan agar nomor tidak diblokir.</li>
            <li>• Server hanya bind ke 127.0.0.1, jadi tidak bisa diakses dari komputer lain secara default.</li>
            <li>• Semua data tersimpan lokal di folder data/ pada PC Anda.</li>
          </ul>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-[#8fcfae] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f6b4a] shadow-[0_8px_24px_rgba(20,67,47,0.05)] transition hover:bg-[#e7f4ec]"
            >
              ← Kembali ke beranda
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
