const path = require("path");
const QRCode = require("qrcode");
const { SESSION_DIR } = require("./db");

let Client, LocalAuth, MessageMedia;
try {
  ({ Client, LocalAuth, MessageMedia } = require("whatsapp-web.js"));
} catch (err) {
  console.warn("[wa] whatsapp-web.js belum terpasang. Jalankan: npm install");
}

const state = {
  status: "starting", // starting | qr | authenticated | ready | disconnected | error
  qrDataUrl: null,
  me: null,
  lastError: null,
};

let client = null;

function buildClient() {
  if (!Client) return null;
  return new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: process.env.CHROME_PATH || undefined,
    },
  });
}

let reconnectTimer = null;
let reconnectAttempts = 0;

function scheduleReconnect(delayMs = 10000) {
  if (reconnectTimer) return;
  reconnectAttempts++;
  const wait = Math.min(delayMs * Math.min(reconnectAttempts, 6), 120000);
  console.log(`[wa] mencoba sambung ulang dalam ${Math.round(wait / 1000)} detik…`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    start();
  }, wait);
}

function start() {
  if (!Client) {
    state.status = "error";
    state.lastError = "whatsapp-web.js tidak tersedia. Jalankan npm install.";
    return;
  }
  if (client) return;

  client = buildClient();

  client.on("qr", async (qr) => {
    state.status = "qr";
    state.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
    console.log("[wa] QR baru tersedia. Buka halaman Koneksi untuk scan.");
  });

  client.on("authenticated", () => {
    state.status = "authenticated";
    state.qrDataUrl = null;
  });

  client.on("ready", () => {
    state.status = "ready";
    state.qrDataUrl = null;
    state.lastError = null;
    reconnectAttempts = 0;
    state.me = client.info && client.info.wid ? client.info.wid._serialized : null;
    console.log("[wa] WhatsApp siap digunakan.");
  });

  client.on("auth_failure", (msg) => {
    state.status = "error";
    state.lastError = String(msg);
    client = null;
    scheduleReconnect();
  });

  client.on("disconnected", (reason) => {
    state.status = "disconnected";
    state.lastError = String(reason);
    state.me = null;
    client = null;
    scheduleReconnect(5000);
  });

  client.initialize().catch((err) => {
    state.status = "error";
    state.lastError = err.message;
    client = null;
    console.error("[wa] gagal inisialisasi:", err.message);
    scheduleReconnect();
  });
}


function getStatus() {
  return { ...state, connected: state.status === "ready" };
}

function isReady() {
  return state.status === "ready" && !!client;
}

function normalizeNumber(raw) {
  let n = String(raw).replace(/[^\d]/g, "");
  if (!n) return null;
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return `${n}@c.us`;
}

function toChatId(target) {
  if (target.target_type === "group") {
    const v = String(target.target_value);
    return v.includes("@g.us") ? v : `${v}@g.us`;
  }
  return normalizeNumber(target.target_value);
}

async function listGroups() {
  if (!isReady()) return [];
  const chats = await client.getChats();
  return chats
    .filter((c) => c.isGroup)
    .map((c) => ({ id: c.id._serialized, name: c.name }));
}

async function sendMessage(chatId, text, attachments = []) {
  if (!isReady()) throw new Error("WhatsApp belum terhubung");
  if (attachments.length === 0) {
    await client.sendMessage(chatId, text || "");
    return;
  }
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const media = MessageMedia.fromFilePath(a.fullPath);
    media.filename = a.file_name;
    await client.sendMessage(chatId, media, {
      caption: i === 0 ? text || undefined : undefined,
      sendMediaAsDocument: !String(a.mime_type).startsWith("image/"),
    });
  }
}

async function logout() {
  if (client) {
    try {
      await client.logout();
    } catch (_) {}
    try {
      await client.destroy();
    } catch (_) {}
    client = null;
  }
  state.status = "starting";
  state.qrDataUrl = null;
  state.me = null;
  setTimeout(start, 1500);
}

module.exports = {
  start,
  getStatus,
  isReady,
  sendMessage,
  listGroups,
  toChatId,
  normalizeNumber,
  logout,
};
