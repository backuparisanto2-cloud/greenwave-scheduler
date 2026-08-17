/* WhatsApp Scheduler - UI (vanilla JS, tanpa build step) */

const app = document.getElementById("app");
const state = {
  user: null,
  page: "koneksi",
  wa: { status: "starting", qrDataUrl: null },
  schedules: [],
  contacts: [],
  logs: [],
  groups: [],
  form: {
    repeat_mode: "once",
    weekdays: [],
    targetMode: "number",
    picked: [],
    editingId: null,
    keepAttachments: [],
    values: {},
  },
  editingContact: null,
  error: "",

};

const PAGES = [
  { id: "koneksi", label: "Koneksi", ic: "\u25C9" },
  { id: "baru", label: "Jadwal Baru", ic: "\u002B" },
  { id: "jadwal", label: "Daftar Jadwal", ic: "\u2637" },
  { id: "kontak", label: "Kontak / CSV", ic: "\u2630" },
  { id: "riwayat", label: "Riwayat", ic: "\u21BB" },
  { id: "pengaturan", label: "Pengaturan", ic: "\u2699" },
];

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.hidden = true), 2600);
}

async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "same-origin", ...options });
  if (res.status === 401 && state.user) {
    state.user = null;
    render();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
  return data;
}

const jsonPost = (url, body) =>
  api(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/* ---------------- Login ---------------- */

function renderLogin() {
  app.innerHTML = `
    <div class="login-wrap">
      <form class="login-card" id="login-form">
        <div class="brand">
          <div class="brand-dot">&#9679;</div>
          <div><strong>WhatsApp Scheduler</strong><span>Penjadwal pesan lokal</span></div>
        </div>
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="username" required />
        <label for="password">Password</label>
        <input id="password" type="password" autocomplete="current-password" required />
        <div class="actions"><button class="btn" style="width:100%" type="submit">Masuk</button></div>
        ${state.error ? `<div class="error">${esc(state.error)}</div>` : ""}
      </form>
    </div>`;

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    state.error = "";
    try {
      state.user = await jsonPost("/api/auth/login", {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      await refreshAll();
    } catch (err) {
      state.error = err.message;
    }
    render();
  });
}

/* ---------------- Shell ---------------- */

function statusPill() {
  const s = state.wa.status;
  if (s === "ready") return `<span class="pill ok"><i class="dot"></i>Terhubung</span>`;
  if (s === "qr") return `<span class="pill warn"><i class="dot"></i>Perlu scan QR</span>`;
  if (s === "error" || s === "disconnected")
    return `<span class="pill bad"><i class="dot"></i>Terputus</span>`;
  return `<span class="pill"><i class="dot"></i>Menyiapkan…</span>`;
}

function render() {
  if (!state.user) return renderLogin();

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-dot">&#9679;</div>
          <div><strong>WA Scheduler</strong><span>${esc(state.user.email)}</span></div>
        </div>
        ${PAGES.map(
          (p) =>
            `<button class="nav-btn ${state.page === p.id ? "active" : ""}" data-page="${p.id}"><span>${p.ic}</span>${p.label}</button>`,
        ).join("")}
        <div class="nav-spacer"></div>
        <button class="nav-btn" id="logout">&#8618; Keluar</button>
      </aside>
      <main class="main">${pageContent()}</main>
      <nav class="bottom-nav">
        ${PAGES.slice(0, 5)
          .map(
            (p) =>
              `<button class="${state.page === p.id ? "active" : ""}" data-page="${p.id}"><span class="ic">${p.ic}</span>${p.label}</button>`,
          )
          .join("")}
      </nav>
    </div>`;

  document.querySelectorAll("[data-page]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = b.dataset.page;
      state.error = "";
      render();
    }),
  );
  const lo = document.getElementById("logout");
  if (lo)
    lo.addEventListener("click", async () => {
      await api("/api/auth/logout", { method: "POST" });
      state.user = null;
      render();
    });

  bindPage();
}

function head(title, sub, right = "") {
  return `<div class="page-head"><div><h1>${title}</h1><div class="sub">${sub}</div></div><div>${right}</div></div>`;
}

function pageContent() {
  switch (state.page) {
    case "koneksi":
      return pageKoneksi();
    case "baru":
      return pageBaru();
    case "jadwal":
      return pageJadwal();
    case "kontak":
      return pageKontak();
    case "riwayat":
      return pageRiwayat();
    default:
      return pagePengaturan();
  }
}

/* ---------------- Pages ---------------- */

function pageKoneksi() {
  const s = state.wa;
  let body;
  if (s.status === "ready") {
    body = `<div class="qr-box"><h2>WhatsApp aktif</h2><p class="sub">Akun: ${esc(s.me || "-")}</p>
      <div class="actions" style="justify-content:center"><button class="btn ghost" id="wa-logout">Putuskan &amp; scan ulang</button></div></div>`;
  } else if (s.status === "qr" && s.qrDataUrl) {
    body = `<div class="qr-box"><h2>Scan QR Code</h2>
      <p class="sub">WhatsApp di HP &rarr; Menu &rarr; Perangkat Tertaut &rarr; Tautkan perangkat</p>
      <img src="${s.qrDataUrl}" alt="QR code WhatsApp" /></div>`;
  } else {
    body = `<div class="qr-box"><h2>Menyiapkan koneksi…</h2>
      <p class="sub">Chrome sedang dijalankan di latar belakang. Tunggu beberapa detik.</p>
      ${s.lastError ? `<div class="error">${esc(s.lastError)}</div>` : ""}</div>`;
  }
  return (
    head("Koneksi WhatsApp", "Status sesi perangkat tertaut", statusPill()) +
    `<div class="card accent">${body}</div>`
  );
}

function pageBaru() {
  const f = state.form;
  const v = f.values || {};
  const editing = !!f.editingId;
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const keptAtt = (f.attachments || []).filter((a) => f.keepAttachments.includes(a.id));
  return (
    head(
      editing ? "Edit Jadwal" : "Jadwal Baru",
      editing
        ? `Mengubah jadwal #${f.editingId}`
        : "Kirim sekali, berulang, atau broadcast dari kontak",
    ) +
    `<form id="form-baru" class="grid two">
      <div class="card accent">
        <h2>Pesan</h2>
        <label>Judul jadwal</label>
        <input name="title" placeholder="Reminder rapat mingguan" value="${esc(v.title || "")}" />
        <label>Isi pesan (gunakan {nama} untuk nama kontak)</label>
        <textarea name="message" placeholder="Halo {nama}, jangan lupa rapat jam 9 pagi.">${esc(v.message || "")}</textarea>
        ${
          keptAtt.length
            ? `<label>Lampiran tersimpan</label>
               <div class="chips">${keptAtt
                 .map(
                   (a) =>
                     `<span class="chip on">${esc(a.file_name)} <button type="button" class="linkx" data-rmatt="${a.id}" title="Hapus lampiran">&times;</button></span>`,
                 )
                 .join("")}</div>`
            : ""
        }
        <label>${keptAtt.length ? "Tambah lampiran" : "Lampiran"} (maks 5 file, 25MB per file)</label>
        <input type="file" name="files" multiple />

      </div>

      <div class="card">
        <h2>Tujuan</h2>
        <div class="chips">
          <button type="button" class="chip ${f.targetMode === "number" ? "on" : ""}" data-tmode="number">Nomor</button>
          <button type="button" class="chip ${f.targetMode === "group" ? "on" : ""}" data-tmode="group">Grup</button>
          <button type="button" class="chip ${f.targetMode === "contacts" ? "on" : ""}" data-tmode="contacts">Kontak / CSV</button>
        </div>
        ${
          f.targetMode === "number"
            ? `<label>Nomor tujuan (pisahkan koma untuk beberapa nomor)</label>
               <input name="numbers" placeholder="08123456789, 6281234567890" value="${esc(v.numbers || "")}" />`
            : f.targetMode === "group"
              ? `<label>Pilih grup</label>
                 <select name="group">
                   <option value="">— pilih grup —</option>
                   ${state.groups
                     .map(
                       (g) =>
                         `<option value="${esc(g.id)}" ${v.group === g.id ? "selected" : ""}>${esc(g.name)}</option>`,
                     )
                     .join("")}
                   ${
                     v.group && !state.groups.some((g) => g.id === v.group)
                       ? `<option value="${esc(v.group)}" selected>${esc(v.groupLabel || v.group)}</option>`
                       : ""
                   }
                 </select>
                 <div class="sub" style="margin-top:6px">${state.groups.length ? "" : "Grup muncul setelah WhatsApp terhubung."}</div>`
              : `<label>Kontak tersimpan (${state.contacts.length})</label>
                 <div class="chips" id="contact-chips">
                   ${
                     state.contacts.length
                       ? state.contacts
                           .map(
                             (c) =>
                               `<button type="button" class="chip ${f.picked.includes(c.id) ? "on" : ""}" data-cid="${c.id}">${esc(c.name || c.phone)} <small>${esc(c.phone)}</small></button>`,
                           )
                           .join("")
                       : `<span class="sub">Belum ada kontak. Impor CSV di menu Kontak.</span>`
                   }
                 </div>
                 <div class="actions"><button type="button" class="btn ghost sm" id="pick-all">Pilih semua</button>
                 <button type="button" class="btn ghost sm" id="pick-none">Kosongkan</button></div>`
        }

        <h2 style="margin-top:18px">Waktu</h2>
        <div class="row two">
          <div>
            <label>Tanggal &amp; jam kirim</label>
            <input type="datetime-local" name="run_at" value="${esc(v.run_at || "")}" required />
          </div>
          <div>
            <label>Pengulangan</label>
            <select name="repeat_mode" id="repeat_mode">
              <option value="once" ${f.repeat_mode === "once" ? "selected" : ""}>Sekali kirim</option>
              <option value="daily" ${f.repeat_mode === "daily" ? "selected" : ""}>Harian</option>
              <option value="weekly" ${f.repeat_mode === "weekly" ? "selected" : ""}>Mingguan</option>
              <option value="monthly" ${f.repeat_mode === "monthly" ? "selected" : ""}>Bulanan</option>
            </select>
          </div>
        </div>
        ${
          f.repeat_mode === "weekly"
            ? `<label>Hari pengiriman</label><div class="chips" id="weekday-chips">
               ${days.map((d, i) => `<button type="button" class="chip ${f.weekdays.includes(i) ? "on" : ""}" data-day="${i}">${d}</button>`).join("")}
               </div>`
            : ""
        }
        ${
          f.repeat_mode !== "once"
            ? `<label>Berakhir pada (opsional)</label><input type="date" name="end_date" value="${esc(v.end_date || "")}" />`
            : ""
        }
        <div class="actions">
          <button class="btn" type="submit">${editing ? "Simpan perubahan" : "Simpan jadwal"}</button>
          ${editing ? `<button class="btn ghost" type="button" id="cancel-edit">Batal</button>` : ""}
        </div>
        ${state.error ? `<div class="error">${esc(state.error)}</div>` : ""}

      </div>
    </form>`
  );
}

function badge(status) {
  const map = {
    pending: ["", "Menunggu"],
    sending: ["warn", "Mengirim"],
    sent: ["ok", "Terkirim"],
    failed: ["bad", "Gagal"],
    paused: ["warn", "Dijeda"],
  };
  const [cls, label] = map[status] || ["", status];
  return `<span class="pill ${cls}">${label}</span>`;
}

const repeatLabel = (s) =>
  ({ once: "Sekali", daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" })[s.repeat_mode] ||
  s.repeat_mode;

function pageJadwal() {
  const list = state.schedules;
  return (
    head("Daftar Jadwal", `${list.length} jadwal tersimpan`) +
    (list.length
      ? `<div class="list">${list
          .map(
            (s) => `<div class="item">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <h3>${esc(s.title || "(tanpa judul)")}</h3>${badge(s.status)}
        </div>
        <div class="meta">${esc(s.run_at)} &middot; ${repeatLabel(s)} &middot; ${s.targets.length} tujuan${
          s.attachments.length ? ` &middot; ${s.attachments.length} lampiran` : ""
        }</div>
        <p class="sub" style="margin:8px 0 0">${esc((s.message || "").slice(0, 160))}</p>
        ${s.last_error ? `<div class="error">${esc(s.last_error)}</div>` : ""}
        <div class="actions">
          <button class="btn ghost sm" data-send="${s.id}">Kirim sekarang</button>
          ${
            s.status === "paused"
              ? `<button class="btn ghost sm" data-resume="${s.id}">Lanjutkan</button>`
              : `<button class="btn ghost sm" data-pause="${s.id}">Jeda</button>`
          }
          <button class="btn danger sm" data-del="${s.id}">Hapus</button>
        </div>
      </div>`,
          )
          .join("")}</div>`
      : `<div class="empty">Belum ada jadwal. Buat di menu <strong>Jadwal Baru</strong>.</div>`)
  );
}

function pageKontak() {
  return (
    head("Kontak / CSV", `${state.contacts.length} kontak tersimpan`) +
    `<div class="grid two">
      <div class="card accent">
        <h2>Impor CSV</h2>
        <p class="sub">Format kolom: <code>nama,nomor</code>. Baris header opsional.</p>
        <form id="csv-form">
          <input type="file" name="file" accept=".csv,text/csv" required />
          <div class="actions"><button class="btn" type="submit">Impor</button></div>
        </form>
        <h2 style="margin-top:20px">Tambah manual</h2>
        <form id="contact-form">
          <div class="row two">
            <div><label>Nama</label><input name="name" placeholder="Budi" /></div>
            <div><label>Nomor</label><input name="phone" placeholder="08123456789" required /></div>
          </div>
          <div class="actions"><button class="btn ghost" type="submit">Tambah kontak</button></div>
        </form>
      </div>
      <div class="card">
        <h2>Daftar kontak</h2>
        <div class="table-wrap">
          <table><thead><tr><th>Nama</th><th>Nomor</th><th></th></tr></thead><tbody>
          ${
            state.contacts.length
              ? state.contacts
                  .map(
                    (c) =>
                      `<tr><td>${esc(c.name || "-")}</td><td>${esc(c.phone)}</td><td style="text-align:right"><button class="btn danger sm" data-delc="${c.id}">Hapus</button></td></tr>`,
                  )
                  .join("")
              : `<tr><td colspan="3" class="sub">Belum ada kontak.</td></tr>`
          }
          </tbody></table>
        </div>
      </div>
    </div>`
  );
}

function pageRiwayat() {
  return (
    head("Riwayat Pengiriman", "200 log terakhir") +
    `<div class="card"><div class="table-wrap">
      <table><thead><tr><th>Waktu</th><th>Tujuan</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>
      ${
        state.logs.length
          ? state.logs
              .map(
                (l) =>
                  `<tr><td>${esc(l.created_at)}</td><td>${esc(l.target)}</td><td>${
                    l.status === "sent"
                      ? '<span class="pill ok">Terkirim</span>'
                      : '<span class="pill bad">Gagal</span>'
                  }</td><td class="sub">${esc(l.detail)}</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="4" class="sub">Belum ada pengiriman.</td></tr>`
      }
      </tbody></table></div></div>`
  );
}

function pagePengaturan() {
  return (
    head("Pengaturan", "Akun dashboard") +
    `<div class="card accent" style="max-width:480px">
      <h2>Ubah password</h2>
      <form id="pass-form">
        <label>Password lama</label><input type="password" name="current" required />
        <label>Password baru (min. 8 karakter)</label><input type="password" name="next" minlength="8" required />
        <div class="actions"><button class="btn" type="submit">Simpan</button></div>
        ${state.error ? `<div class="error">${esc(state.error)}</div>` : ""}
      </form>
    </div>
    <div class="card" style="max-width:480px">
      <h2>Data lokal</h2>
      <p class="sub">Database: <code>data/scheduler.db</code><br />Lampiran: <code>data/uploads/</code><br />Sesi WhatsApp: <code>data/wa-session/</code></p>
      <p class="sub">Backup cukup dengan menyalin folder <code>data/</code>.</p>
    </div>`
  );
}

/* ---------------- Bindings ---------------- */

function bindPage() {
  const on = (sel, ev, fn) => {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  };

  on("#wa-logout", "click", async () => {
    await api("/api/wa/logout", { method: "POST" });
    toast("Sesi diputus, tunggu QR baru");
  });

  document.querySelectorAll("[data-tmode]").forEach((b) =>
    b.addEventListener("click", () => {
      state.form.targetMode = b.dataset.tmode;
      render();
    }),
  );
  document.querySelectorAll("[data-day]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = +b.dataset.day;
      const w = state.form.weekdays;
      state.form.weekdays = w.includes(d) ? w.filter((x) => x !== d) : [...w, d];
      b.classList.toggle("on");
    }),
  );
  document.querySelectorAll("[data-cid]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = +b.dataset.cid;
      const p = state.form.picked;
      state.form.picked = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      b.classList.toggle("on");
    }),
  );
  on("#pick-all", "click", () => {
    state.form.picked = state.contacts.map((c) => c.id);
    render();
  });
  on("#pick-none", "click", () => {
    state.form.picked = [];
    render();
  });
  on("#repeat_mode", "change", (e) => {
    state.form.repeat_mode = e.target.value;
    render();
  });

  on("#form-baru", "submit", async (e) => {
    e.preventDefault();
    state.error = "";
    const fd = new FormData(e.target);
    const f = state.form;

    let targets = [];
    if (f.targetMode === "number") {
      targets = String(fd.get("numbers") || "")
        .split(/[,;\n]/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => ({ target_type: "number", target_value: n, label: "" }));
    } else if (f.targetMode === "group") {
      const g = fd.get("group");
      if (g) targets = [{ target_type: "group", target_value: g, label: "" }];
    } else {
      targets = state.contacts
        .filter((c) => f.picked.includes(c.id))
        .map((c) => ({ target_type: "number", target_value: c.phone, label: c.name || "" }));
    }
    if (!targets.length) {
      state.error = "Pilih minimal satu tujuan.";
      return render();
    }

    const payload = {
      title: String(fd.get("title") || ""),
      message: String(fd.get("message") || ""),
      repeat_mode: f.repeat_mode,
      weekdays: f.repeat_mode === "weekly" ? f.weekdays.join(",") : "",
      month_day:
        f.repeat_mode === "monthly" && fd.get("run_at")
          ? new Date(String(fd.get("run_at"))).getDate()
          : null,
      run_at: String(fd.get("run_at") || ""),
      end_date: fd.get("end_date") ? String(fd.get("end_date")) : null,
      targets,
    };
    if (f.repeat_mode === "weekly" && f.weekdays.length === 0) {
      state.error = "Pilih minimal satu hari untuk jadwal mingguan.";
      return render();
    }

    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    for (const file of e.target.querySelector('input[name="files"]').files) {
      body.append("files", file);
    }

    try {
      await api("/api/schedules", { method: "POST", body });
      state.form = { repeat_mode: "once", weekdays: [], targetMode: "number", picked: [] };
      state.page = "jadwal";
      await refreshData();
      toast("Jadwal tersimpan");
    } catch (err) {
      state.error = err.message;
    }
    render();
  });

  document.querySelectorAll("[data-send]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/schedules/${b.dataset.send}/send-now`, { method: "POST" });
      toast("Dikirim (cek Riwayat)");
      setTimeout(async () => {
        await refreshData();
        render();
      }, 2500);
    }),
  );
  document.querySelectorAll("[data-pause]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/schedules/${b.dataset.pause}/pause`, { method: "POST" });
      await refreshData();
      render();
    }),
  );
  document.querySelectorAll("[data-resume]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/schedules/${b.dataset.resume}/resume`, { method: "POST" });
      await refreshData();
      render();
    }),
  );
  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("Hapus jadwal ini?")) return;
      await api(`/api/schedules/${b.dataset.del}`, { method: "DELETE" });
      await refreshData();
      render();
    }),
  );
  document.querySelectorAll("[data-delc]").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/contacts/${b.dataset.delc}`, { method: "DELETE" });
      await refreshData();
      render();
    }),
  );

  on("#csv-form", "submit", async (e) => {
    e.preventDefault();
    const body = new FormData(e.target);
    try {
      const r = await api("/api/contacts/import", { method: "POST", body });
      toast(`${r.imported} kontak diimpor, ${r.skipped} dilewati`);
      await refreshData();
      render();
    } catch (err) {
      toast(err.message);
    }
  });

  on("#contact-form", "submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await jsonPost("/api/contacts", {
        name: String(fd.get("name") || ""),
        phone: String(fd.get("phone") || ""),
      });
      await refreshData();
      render();
    } catch (err) {
      toast(err.message);
    }
  });

  on("#pass-form", "submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.error = "";
    try {
      await jsonPost("/api/auth/password", {
        current: String(fd.get("current")),
        next: String(fd.get("next")),
      });
      toast("Password diperbarui");
    } catch (err) {
      state.error = err.message;
    }
    render();
  });
}

/* ---------------- Data ---------------- */

async function refreshStatus() {
  if (!state.user) return;
  try {
    const prev = state.wa.status;
    state.wa = await api("/api/wa/status");
    if (state.wa.status !== prev) {
      if (state.wa.status === "ready") {
        try {
          state.groups = await api("/api/wa/groups");
        } catch (_) {}
      }
      if (state.page === "koneksi") render();
    } else if (state.page === "koneksi" && state.wa.status === "qr") {
      const img = document.querySelector(".qr-box img");
      if (img && state.wa.qrDataUrl && img.src !== state.wa.qrDataUrl) render();
    }
  } catch (_) {}
}

async function refreshData() {
  if (!state.user) return;
  const [schedules, contacts, logs] = await Promise.all([
    api("/api/schedules").catch(() => []),
    api("/api/contacts").catch(() => []),
    api("/api/schedules/logs/all").catch(() => []),
  ]);
  state.schedules = schedules;
  state.contacts = contacts;
  state.logs = logs;
}

async function refreshAll() {
  await Promise.all([refreshData(), refreshStatus()]);
}

async function boot() {
  try {
    state.user = await api("/api/auth/me");
    await refreshAll();
  } catch (_) {
    state.user = null;
  }
  render();
  setInterval(refreshStatus, 4000);
  setInterval(async () => {
    if (!state.user) return;
    await refreshData();
    if (["jadwal", "riwayat", "kontak"].includes(state.page)) render();
  }, 15000);
}

boot();
