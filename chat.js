const API = 'http://localhost:8000';
let history = [], isWaiting = false;

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const welcomeState = document.getElementById('welcomeState');
const messagesList = document.getElementById('messagesList');
const typingIndicator = document.getElementById('typingIndicator');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messagesArea = document.getElementById('messagesArea');
const langSelect = document.getElementById('langSelect');
const clearChat = document.getElementById('clearChat');
const attachBtn = document.getElementById('attachBtn');
const inputDisclaimer = document.querySelector('.input-disclaimer');

let currentAttachment = null;
const attachmentInput = document.createElement('input');
attachmentInput.type = 'file';
attachmentInput.accept = '.txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png';
attachmentInput.style.display = 'none';
document.body.appendChild(attachmentInput);

const attachmentBar = document.createElement('div');
attachmentBar.className = 'attachment-bar hidden';
if (inputDisclaimer) inputDisclaimer.insertAdjacentElement('afterend', attachmentBar);

// Nav solid
document.querySelector('.nav')?.classList.add('solid');

// Sidebar toggle
sidebarToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
sidebarClose?.addEventListener('click', () => sidebar.classList.remove('open'));

// New chat
document.getElementById('newChatBtn')?.addEventListener('click', () => {
  history = [];
  messagesList.innerHTML = '';
  welcomeState.classList.remove('hidden');
  sidebar.classList.remove('open');
});

// Clear chat
clearChat?.addEventListener('click', () => {
  history = [];
  messagesList.innerHTML = '';
  welcomeState.classList.remove('hidden');
});

// Input resize
userInput?.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 130) + 'px';
  sendBtn.disabled = !userInput.value.trim();
});

// Enter to send
userInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) doSend(); }
});

sendBtn?.addEventListener('click', doSend);
attachBtn?.addEventListener('click', () => attachmentInput.click());

attachmentInput.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const info = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    excerpt: ''
  };
  if (file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      info.excerpt = text.slice(0, 1800);
    } catch {}
  }
  setAttachment(info);
  e.target.value = '';
});

// Topic chips & suggestions
document.querySelectorAll('.topic-chip, .suggestion-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.q;
    if (q) { userInput.value = q; sendBtn.disabled = false; doSend(); sidebar.classList.remove('open'); }
  });
});

// URL topic
const tp = new URLSearchParams(location.search).get('topic');
if (tp) {
  const MAP = { labour:'What are my rights as a worker under Indian labour law?', consumer:'How do I file a consumer court complaint in India?', women:'What legal protections do women have under Indian law?', constitution:'What are my fundamental rights under the Indian Constitution?', schemes:'What government welfare schemes am I eligible for?', property:'What are my rights as a tenant in India?' };
  if (MAP[tp]) setTimeout(() => { userInput.value = MAP[tp]; sendBtn.disabled = false; doSend(); }, 700);
}

function doSend() {
  const text = userInput.value.trim();
  if (!text || isWaiting) return;
  userInput.value = ''; userInput.style.height = 'auto'; sendBtn.disabled = true;
  const payload = buildPayloadText(text);
  const display = currentAttachment ? `${text}\n\n[Attachment: ${currentAttachment.name}]` : text;
  sendMessage(payload, display);
  setAttachment(null);
}

async function sendMessage(text, displayText = text) {
  welcomeState.classList.add('hidden');
  isWaiting = true;
  addUserMsg(displayText);
  history.push({ role: 'user', content: text });
  typingIndicator.classList.remove('hidden');
  scrollBottom();

  try {
    const res = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, language: langSelect.value, history: history.slice(-10) })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    typingIndicator.classList.add('hidden');
    addBotMsg(data);
    history.push({ role: 'assistant', content: data.answer });
  } catch {
    typingIndicator.classList.add('hidden');
    addBotMsg({ answer: '⚠ Backend not connected. Run `uvicorn main:app --reload` at port 8000, then retry.', laws_cited: [], suggested_actions: [], confidence: 0 });
  }
  isWaiting = false;
  sendBtn.disabled = !userInput.value.trim();
  scrollBottom();
}

function addUserMsg(text) {
  const row = document.createElement('div');
  row.className = 'message-row user';
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  row.innerHTML = `
    <div class="msg-avatar user">👤</div>
    <div class="msg-body">
      <div class="msg-bubble">${esc(text)}</div>
      <div class="msg-meta">${time}</div>
    </div>`;
  messagesList.appendChild(row);
}

function addBotMsg(d) {
  const row = document.createElement('div');
  row.className = 'message-row bot';
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const answer = esc(d.answer).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const laws = d.laws_cited?.length
    ? `<div class="law-citations">${d.laws_cited.map(l => `<span class="law-pill">📜 ${esc(l)}</span>`).join('')}</div>`
    : '';
  const actions = d.suggested_actions?.length
    ? `<div class="msg-actions">${d.suggested_actions.map(a => {
        const cls = a.type === 'document' ? 'fire' : '';
        const href = a.type === 'document' ? `document.html?template=${a.template}` : 'aid.html';
        return `<a href="${href}" class="msg-action-btn ${cls}">${a.type === 'document' ? '📄' : '📍'} ${esc(a.label)}</a>`;
      }).join('')}</div>` : '';
  const conf = d.confidence ? `<span style="color:var(--teal)"> · ${Math.round(d.confidence * 100)}%</span>` : '';
  row.innerHTML = `
    <div class="msg-avatar bot">⚖</div>
    <div class="msg-body">
      <div class="msg-bubble">${answer}${laws}${actions}</div>
      <div class="msg-meta">${time} · NyayaSethu${conf}</div>
    </div>`;
  messagesList.appendChild(row);
}

function scrollBottom() {
  setTimeout(() => { messagesArea.scrollTop = messagesArea.scrollHeight; }, 60);
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setAttachment(fileInfo) {
  currentAttachment = fileInfo;
  if (!attachmentBar) return;
  if (!fileInfo) {
    attachmentBar.classList.add('hidden');
    attachmentBar.innerHTML = '';
    return;
  }
  attachmentBar.classList.remove('hidden');
  attachmentBar.innerHTML = `
    <span class="attachment-name">${esc(fileInfo.name)}</span>
    <span class="attachment-size">${formatSize(fileInfo.size)}</span>
    <button type="button" class="attachment-remove" title="Remove attachment">Remove</button>
  `;
  attachmentBar.querySelector('.attachment-remove')?.addEventListener('click', () => setAttachment(null), { once: true });
}

function buildPayloadText(message) {
  if (!currentAttachment) return message;
  const extra = [
    '[Attached file metadata]',
    `File name: ${currentAttachment.name}`,
    `File type: ${currentAttachment.type}`,
    `File size: ${currentAttachment.size} bytes`
  ];
  if (currentAttachment.excerpt) {
    extra.push('File excerpt:');
    extra.push(currentAttachment.excerpt);
  }
  return `${message}\n\n${extra.join('\n')}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Voice
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recog = new SR(); recog.continuous = false; recog.interimResults = true;
  const micBtn = document.getElementById('micBtn');
  const voiceToggle = document.getElementById('voiceToggle');
  let recording = false;
  const langMap = {
    en: 'en-IN',
    as: 'as-IN',
    bn: 'bn-IN',
    brx: 'hi-IN',
    doi: 'hi-IN',
    gu: 'gu-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ks: 'ur-IN',
    kok: 'hi-IN',
    mai: 'hi-IN',
    ml: 'ml-IN',
    mni: 'bn-IN',
    mr: 'mr-IN',
    ne: 'ne-NP',
    or: 'or-IN',
    pa: 'pa-IN',
    sa: 'hi-IN',
    sat: 'hi-IN',
    sd: 'ur-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    ur: 'ur-IN'
  };
  recog.onresult = e => {
    userInput.value = [...e.results].map(r => r[0].transcript).join('');
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 130) + 'px';
    sendBtn.disabled = false;
  };
  recog.onend = () => { recording = false; micBtn?.classList.remove('recording'); };
  [micBtn, voiceToggle].forEach(btn => btn?.addEventListener('click', () => {
    if (recording) { recog.stop(); }
    else { recog.lang = langMap[langSelect.value] || 'en-IN'; recog.start(); recording = true; micBtn?.classList.add('recording'); }
  }));
}

