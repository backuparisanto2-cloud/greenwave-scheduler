import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsApp Scheduler — Penjadwal Pesan Lokal Windows 10" },
      {
        name: "description",
        content:
          "Penjadwal pesan WhatsApp yang berjalan lokal di Windows 10: scan QR, database SQLite, lampiran file, jadwal berulang, dan broadcast CSV.",
      },
      { property: "og:title", content: "WhatsApp Scheduler — Penjadwal Pesan Lokal" },
      {
        property: "og:description",
        content:
          "Jalankan dengan npm start di Windows 10, scan QR, lalu jadwalkan pesan WhatsApp dengan lampiran dan pengulangan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { n: "1", t: "Install Node.js 20 LTS", d: "Unduh installer LTS dari nodejs.org, biarkan opsi Add to PATH tercentang." },
  { n: "2", t: "npm install", d: "Buka Command Prompt di folder wa-scheduler lalu pasang dependency (±3–5 menit)." },
  { n: "3", t: "npm run build && npm start", d: "Aplikasi berjalan di http://localhost:3000 di PC Anda." },
  { n: "4", t: "Scan QR code", d: "Menu Koneksi → scan lewat WhatsApp → Perangkat Tertaut. Sesi tersimpan permanen." },
  { n: "5", t: "Buat jadwal", d: "Pilih tujuan, tanggal & jam bebas, lampirkan file, atur pengulangan." },
];

const features = [
  { t: "Datetime bebas", d: "Tentukan tanggal dan jam sendiri, sekali kirim atau berulang harian, mingguan, bulanan." },
  { t: "Database lokal", d: "SQLite di folder data/ pada PC Anda. Tidak ada data yang keluar dari komputer." },
  { t: "Lampiran file", d: "Kirim gambar, PDF, Word, atau Excel hingga 25 MB per file, maksimal 5 file per jadwal." },
  { t: "Nomor & grup", d: "Kirim ke nomor pribadi maupun grup WhatsApp yang terdeteksi otomatis." },
  { t: "Broadcast CSV", d: "Impor daftar kontak dari CSV, personalisasi dengan {nama}, jeda otomatis antar pesan." },
  { t: "Riwayat lengkap", d: "Log status terkirim atau gagal per tujuan, lengkap dengan pesan error." },
];

function Index() {
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
            to="/tutorial"
            className="rounded-lg border border-[#8fcfae] bg-white px-4 py-2 text-sm font-semibold text-[#1f6b4a] shadow-[0_8px_24px_rgba(20,67,47,0.05)] transition hover:bg-[#e7f4ec]"
          >
            Tutorial
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="border-b border-[#dcece2] py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8fcfae] bg-[#e7f4ec] px-3 py-1 text-xs font-semibold text-[#1f6b4a]">
            Aplikasi lokal Windows 10
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Jadwalkan pesan WhatsApp langsung dari PC Anda
          </h1>
          <p className="mt-3 max-w-2xl text-[#6b8177]">
            Dibangun dengan whatsapp-web.js. Cukup <code className="rounded bg-[#e7f4ec] px-1.5 py-0.5 text-[#1f6b4a]">npm start</code>,
            scan QR code sekali, lalu atur pengingat dengan tanggal dan jam sendiri. Semua data — jadwal, kontak, dan
            lampiran — tersimpan di database lokal komputer Anda.
          </p>
          <div className="mt-6 rounded-xl border border-[#dcece2] border-l-[3px] border-l-[#2f9e6b] bg-[#fbfdfc] p-4 text-sm">
            Kode aplikasi ada di folder <code className="font-semibold">wa-scheduler/</code> pada proyek ini, lengkap
            dengan tutorial di <code className="font-semibold">wa-scheduler/README-DEPLOY.md</code>.
          </div>
        </section>

        <section className="border-b border-[#dcece2] py-12">
          <h2 className="text-xl font-semibold">Fitur</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.t}
                className="rounded-[14px] border border-[#dcece2] border-l-[3px] border-l-[#8fcfae] bg-white p-4 shadow-[0_8px_24px_rgba(20,67,47,0.05)]"
              >
                <h3 className="text-[15px] font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-[#6b8177]">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-xl font-semibold">Langkah deploy</h2>
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
          <p className="mt-6 text-sm text-[#6b8177]">
            Halaman ini hanya panduan. Aplikasi penjadwal tidak bisa berjalan di preview karena membutuhkan Node.js dan
            Chrome di komputer lokal.
          </p>
        </section>
      </main>
    </div>
  );
}
