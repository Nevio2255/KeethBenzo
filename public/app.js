const API = '/.netlify/functions';

function getPassword() { return localStorage.getItem('kb_pw'); }
function setPassword(pw) { localStorage.setItem('kb_pw', pw); }

async function apiCall(path, options = {}) {
  const res = await fetch(`${API}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-dashboard-password': getPassword() || '',
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  return res.json();
}

// ---------- LOGIN ----------
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  init();
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const pw = document.getElementById('login-password').value;
  setPassword(pw);
  try {
    await apiCall('users');
    showApp();
  } catch {
    document.getElementById('login-error').textContent = 'Falsches Passwort';
  }
});

// ---------- MENÜ ----------
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
  });
});

// ---------- LIVE CHAT ----------
let activeChatId = null;
let usersCache = [];

async function loadUsers() {
  usersCache = await apiCall('users');
  renderUserList();
}

function renderUserList() {
  const list = document.getElementById('user-list');
  list.innerHTML = '';
  usersCache.forEach(u => {
    const el = document.createElement('div');
    el.className = 'user-item' + (u.chatId == activeChatId ? ' active' : '');
    el.innerHTML = `<div class="name">${u.username}</div><div class="time">${new Date(u.lastMessage || u.firstSeen).toLocaleString('de-DE')}</div>`;
    el.addEventListener('click', () => openChat(u.chatId));
    list.appendChild(el);
  });
}

function openChat(chatId) {
  activeChatId = chatId;
  const user = usersCache.find(u => u.chatId == chatId);
  document.getElementById('chat-header').textContent = user.username;
  const msgBox = document.getElementById('chat-messages');
  msgBox.innerHTML = '';
  user.messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg ' + m.from;
    div.textContent = m.text;
    msgBox.appendChild(div);
  });
  msgBox.scrollTop = msgBox.scrollHeight;
  renderUserList();
}

document.getElementById('reply-send').addEventListener('click', sendReply);
document.getElementById('reply-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendReply(); });

async function sendReply() {
  const input = document.getElementById('reply-input');
  const text = input.value.trim();
  if (!text || !activeChatId) return;
  await apiCall('reply', { method: 'POST', body: JSON.stringify({ chatId: activeChatId, text }) });
  input.value = '';
  await loadUsers();
  openChat(activeChatId);
}

// ---------- UMSATZ ----------
async function loadRevenue() {
  const { total, transactions } = await apiCall('revenue');
  document.getElementById('revenue-total').textContent = '€' + Number(total || 0).toFixed(2);
  const body = document.getElementById('tx-body');
  body.innerHTML = '';
  (transactions || []).forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(t.createdAt).toLocaleString('de-DE')}</td><td>${t.name || '-'}</td><td>${t.amount} ${t.currency}</td>`;
    body.appendChild(tr);
  });
}

// ---------- MITARBEITER-CODES ----------
document.getElementById('generate-code-btn').addEventListener('click', async () => {
  const emailInput = document.getElementById('employee-email');
  const email = emailInput.value.trim();
  if (!email) return;
  await apiCall('employee-code', { method: 'POST', body: JSON.stringify({ email }) });
  emailInput.value = '';
  loadCodes();
});

async function loadCodes() {
  const codes = await apiCall('employee-codes');
  const body = document.getElementById('codes-body');
  body.innerHTML = '';
  codes.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.code}</td><td>${c.email}</td><td>${new Date(c.createdAt).toLocaleString('de-DE')}</td>`;
    body.appendChild(tr);
  });
}

// ---------- INIT ----------
function init() {
  loadUsers();
  loadRevenue();
  loadCodes();
  setInterval(loadUsers, 5000);
  setInterval(loadRevenue, 30000);
}

// Beim Start prüfen, ob schon eingeloggt
(async () => {
  if (getPassword()) {
    try { await apiCall('users'); showApp(); return; } catch {}
  }
  showLogin();
})();
