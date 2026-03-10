const API_CONFIG_KEY = "nyayamithra_api_url";

function apiBase() {
  return String(window.NYAYAMITHRA_API || "").replace(/\/+$/, "");
}

function localFallbackApi() {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.protocol === "file:";
  return isLocal ? "http://127.0.0.1:8000" : "";
}

function fallbackApi() {
  return String(window.NYAYAMITHRA_DEFAULT_API || localFallbackApi() || "").replace(/\/+$/, "");
}

function persistApiBase(url) {
  if (typeof window.setNyayaMithraApi === "function") {
    window.setNyayaMithraApi(url);
    return;
  }
  if (!url) {
    localStorage.removeItem(API_CONFIG_KEY);
  } else {
    localStorage.setItem(API_CONFIG_KEY, url);
  }
  window.NYAYAMITHRA_API = url;
}

async function fetchApi(path, init) {
  const primary = apiBase();
  try {
    return await fetch(`${primary}${path}`, init);
  } catch (err) {
    const fallback = fallbackApi();
    if (!fallback || fallback === primary) throw err;
    persistApiBase(fallback);
    return await fetch(`${fallback}${path}`, init);
  }
}
let isWaiting = false;

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const welcomeState = document.getElementById("welcomeState");
const messagesList = document.getElementById("messagesList");
const typingIndicator = document.getElementById("typingIndicator");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messagesArea = document.getElementById("messagesArea");
const langSelect = document.getElementById("langSelect");
const clearChat = document.getElementById("clearChat");
const attachBtn = document.getElementById("attachBtn");
const chatHistoryEl = document.getElementById("chatHistory");
const inputDisclaimer = document.querySelector(".input-disclaimer");
const micBtn = document.getElementById("micBtn");

let currentAttachment = null;
let sessions = [];
let activeSessionId = null;

const attachmentInput = document.createElement("input");
attachmentInput.type = "file";
attachmentInput.accept = ".txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png";
attachmentInput.style.display = "none";
document.body.appendChild(attachmentInput);

const attachmentBar = document.createElement("div");
attachmentBar.className = "attachment-bar hidden";
if (inputDisclaimer) inputDisclaimer.insertAdjacentElement("afterend", attachmentBar);

document.querySelector(".nav")?.classList.add("solid");

sidebarToggle?.addEventListener("click", () => sidebar.classList.toggle("open"));
sidebarClose?.addEventListener("click", () => sidebar.classList.remove("open"));

document.getElementById("newChatBtn")?.addEventListener("click", () => {
  startNewSession();
  sidebar.classList.remove("open");
});

clearChat?.addEventListener("click", () => {
  const session = getActiveSession();
  if (!session) return;
  session.messages = [];
  session.title = "New conversation";
  session.updatedAt = Date.now();
  saveSessions();
  renderHistory();
  renderActiveSession();
});

userInput?.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 130) + "px";
  sendBtn.disabled = !userInput.value.trim();
});

userInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) doSend();
  }
});

sendBtn?.addEventListener("click", doSend);
attachBtn?.addEventListener("click", () => attachmentInput.click());

attachmentInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const info = {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    excerpt: "",
  };
  if (file.type.startsWith("text/")) {
    try {
      const text = await file.text();
      info.excerpt = text.slice(0, 1800);
    } catch {}
  }
  setAttachment(info);
  e.target.value = "";
});

document.querySelectorAll(".topic-chip, .suggestion-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const q = btn.dataset.q;
    if (!q) return;
    userInput.value = q;
    sendBtn.disabled = false;
    doSend();
    sidebar.classList.remove("open");
  });
});

const tp = new URLSearchParams(location.search).get("topic");
if (tp) {
  const map = {
    labour: "What are my rights as a worker under Indian labour law?",
    consumer: "How do I file a consumer court complaint in India?",
    women: "What legal protections do women have under Indian law?",
    constitution: "What are my fundamental rights under the Indian Constitution?",
    schemes: "What government welfare schemes am I eligible for?",
    property: "What are my rights as a tenant in India?",
  };
  if (map[tp]) {
    setTimeout(() => {
      userInput.value = map[tp];
      sendBtn.disabled = false;
      doSend();
    }, 700);
  }
}

initializeHistory();

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("nyayamithra_user") || "null");
  } catch {
    return null;
  }
}

function historyStorageKey() {
  const user = readCurrentUser();
  const email = (user?.email || "guest").trim().toLowerCase();
  return `nyayamithra_chat_sessions_${email}`;
}

function loadSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(historyStorageKey()) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveSessions() {
  localStorage.setItem(historyStorageKey(), JSON.stringify(sessions));
}

function createSession(initialTitle = "New conversation") {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

function initializeHistory() {
  sessions = loadSessions();
  if (!sessions.length) {
    const first = createSession();
    sessions.push(first);
    activeSessionId = first.id;
    saveSessions();
  } else {
    const latest = [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    activeSessionId = latest?.id || null;
  }
  renderHistory();
  renderActiveSession();
}

function getActiveSession() {
  return sessions.find((s) => s.id === activeSessionId) || null;
}

function startNewSession() {
  const session = createSession();
  sessions.unshift(session);
  activeSessionId = session.id;
  saveSessions();
  renderHistory();
  renderActiveSession();
}

function touchSession(session) {
  session.updatedAt = Date.now();
  sessions = [session, ...sessions.filter((s) => s.id !== session.id)];
}

function titleFromMessage(text) {
  const t = String(text || "").trim().replace(/\s+/g, " ");
  if (!t) return "New conversation";
  return t.length > 56 ? `${t.slice(0, 56)}...` : t;
}

function renderHistory() {
  if (!chatHistoryEl) return;
  const ordered = [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  chatHistoryEl.innerHTML = ordered
    .map((s) => {
      const cls = s.id === activeSessionId ? "history-item active" : "history-item";
      return `<div class="${cls}" data-id="${s.id}">${esc(s.title || "New conversation")}</div>`;
    })
    .join("");

  chatHistoryEl.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", () => {
      activeSessionId = el.dataset.id;
      renderHistory();
      renderActiveSession();
      sidebar.classList.remove("open");
    });
  });
}

function renderActiveSession() {
  const session = getActiveSession();
  messagesList.innerHTML = "";
  if (!session || !session.messages.length) {
    welcomeState.classList.remove("hidden");
    return;
  }

  welcomeState.classList.add("hidden");
  session.messages.forEach((m) => {
    if (m.role === "user") {
      addUserMsg(m.display || m.content, m.time);
    } else {
      addBotMsg(m.payload || { answer: m.content, laws_cited: [], suggested_actions: [], confidence: 0 }, m.time);
    }
  });
  scrollBottom();
}

function buildApiHistory(session) {
  return session.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-10);
}

function doSend() {
  const text = userInput.value.trim();
  if (!text || isWaiting) return;
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  const payload = buildPayloadText(text);
  const display = currentAttachment ? `${text}\n\n[Attachment: ${currentAttachment.name}]` : text;
  sendMessage(payload, display);
  setAttachment(null);
}

async function sendMessage(text, displayText = text) {
  let session = getActiveSession();
  if (!session) {
    startNewSession();
    session = getActiveSession();
    if (!session) return;
  }

  welcomeState.classList.add("hidden");
  isWaiting = true;

  addUserMsg(displayText);
  session.messages.push({
    role: "user",
    content: text,
    display: displayText,
    time: Date.now(),
  });
  if (!session.messages || session.messages.length === 1) {
    session.title = titleFromMessage(displayText);
  }
  touchSession(session);
  saveSessions();
  renderHistory();

  typingIndicator.classList.remove("hidden");
  scrollBottom();

  try {
    const res = await fetchApi("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        language: langSelect.value,
        history: buildApiHistory(session),
      }),
    });
    if (!res.ok) throw new Error();

    const data = await res.json();
    typingIndicator.classList.add("hidden");
    addBotMsg(data);

    session.messages.push({
      role: "assistant",
      content: data.answer,
      payload: data,
      time: Date.now(),
    });
  } catch {
    typingIndicator.classList.add("hidden");
    const fallback = {
      answer:
        "Backend not connected. Local: run `python -m uvicorn main:app --port 8000`. Production: open this page with `?api=https://your-backend-url` once.",
      laws_cited: [],
      suggested_actions: [],
      confidence: 0,
    };
    addBotMsg(fallback);
    session.messages.push({
      role: "assistant",
      content: fallback.answer,
      payload: fallback,
      time: Date.now(),
    });
  }

  touchSession(session);
  saveSessions();
  renderHistory();
  isWaiting = false;
  sendBtn.disabled = !userInput.value.trim();
  scrollBottom();
}

function addUserMsg(text, timeMs = Date.now()) {
  const row = document.createElement("div");
  row.className = "message-row user";
  const time = new Date(timeMs).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  row.innerHTML = `
    <div class="msg-avatar user">USER</div>
    <div class="msg-body">
      <div class="msg-bubble">${esc(text)}</div>
      <div class="msg-meta">${time}</div>
    </div>`;
  messagesList.appendChild(row);
}

function addBotMsg(d, timeMs = Date.now()) {
  const row = document.createElement("div");
  row.className = "message-row bot";
  const time = new Date(timeMs).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const answer = esc(d.answer || "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  const laws = d.laws_cited?.length
    ? `<div class="law-citations">${d.laws_cited.map((l) => `<span class="law-pill">LAW ${esc(l)}</span>`).join("")}</div>`
    : "";
  const actions = d.suggested_actions?.length
    ? `<div class="msg-actions">${d.suggested_actions
        .map((a) => {
          const cls = a.type === "document" ? "fire" : "";
          const href = a.type === "document" ? `document.html?template=${a.template}` : "aid.html";
          const icon = a.type === "document" ? "DOC" : "AID";
          return `<a href="${href}" class="msg-action-btn ${cls}">${icon} ${esc(a.label)}</a>`;
        })
        .join("")}</div>`
    : "";
  const conf = d.confidence ? `<span style="color:var(--teal)"> - ${Math.round(d.confidence * 100)}%</span>` : "";
  row.innerHTML = `
    <div class="msg-avatar bot">LAW</div>
    <div class="msg-body">
      <div class="msg-bubble">${answer}${laws}${actions}</div>
      <div class="msg-meta">${time} - NyayaMithra${conf}</div>
    </div>`;
  messagesList.appendChild(row);
}

function scrollBottom() {
  setTimeout(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }, 60);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setAttachment(fileInfo) {
  currentAttachment = fileInfo;
  if (!attachmentBar) return;
  if (!fileInfo) {
    attachmentBar.classList.add("hidden");
    attachmentBar.innerHTML = "";
    return;
  }
  attachmentBar.classList.remove("hidden");
  attachmentBar.innerHTML = `
    <span class="attachment-name">${esc(fileInfo.name)}</span>
    <span class="attachment-size">${formatSize(fileInfo.size)}</span>
    <button type="button" class="attachment-remove" title="Remove attachment">Remove</button>
  `;
  attachmentBar.querySelector(".attachment-remove")?.addEventListener("click", () => setAttachment(null), { once: true });
}

function buildPayloadText(message) {
  if (!currentAttachment) return message;
  const extra = [
    "[Attached file metadata]",
    `File name: ${currentAttachment.name}`,
    `File type: ${currentAttachment.type}`,
    `File size: ${currentAttachment.size} bytes`,
  ];
  if (currentAttachment.excerpt) {
    extra.push("File excerpt:");
    extra.push(currentAttachment.excerpt);
  }
  return `${message}\n\n${extra.join("\n")}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const RECOG_LANG_MAP = {
  en: "en-IN",
  as: "hi-IN",
  bn: "bn-IN",
  brx: "hi-IN",
  doi: "hi-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ks: "ur-IN",
  kok: "hi-IN",
  mai: "hi-IN",
  ml: "ml-IN",
  mni: "bn-IN",
  mr: "mr-IN",
  ne: "hi-IN",
  or: "hi-IN",
  pa: "pa-IN",
  sa: "hi-IN",
  sat: "hi-IN",
  sd: "ur-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
};

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recog = new SR();
  recog.continuous = false;
  recog.interimResults = true;
  let recording = false;

  recog.onresult = (e) => {
    userInput.value = [...e.results].map((r) => r[0].transcript).join("");
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 130) + "px";
    sendBtn.disabled = !userInput.value.trim();
  };

  recog.onend = () => {
    recording = false;
    micBtn?.classList.remove("recording");
  };

  micBtn?.addEventListener("click", () => {
    if (recording) {
      recog.stop();
      return;
    }
    recog.lang = RECOG_LANG_MAP[langSelect.value] || "en-IN";
    try {
      recog.start();
      recording = true;
      micBtn?.classList.add("recording");
    } catch {
      recog.lang = "en-IN";
      try {
        recog.start();
        recording = true;
        micBtn?.classList.add("recording");
      } catch {}
    }
  });
} else if (micBtn) {
  micBtn.disabled = true;
  micBtn.title = "Voice input not supported in this browser";
}
