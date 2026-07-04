const API = '/.netlify/functions';

function getToken() { return localStorage.getItem('kb_token'); }
function setToken(t) { localStorage.setItem('kb_token', t); }
function clearToken() { localStorage.removeItem('kb_token'); }
function getRole() { return localStorage.getItem('kb_role'); }
function setRole(r) { localStorage.setItem('kb_role', r); }
function getName() { return localStorage.getItem('kb_name'); }
function setName(n) { localStorage.setItem('kb_name', n); }

async function apiCall(path, options = {}) {
  const res = await fetch(`${API}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    showScreen('login');
    throw new Error(data.error || 'Nicht eingeloggt');
  }
  if (!res.ok) throw new Error(data.error || 'Fehler');
  return data;
}

// ---------- SCREEN SWITCHING ----------
function showScreen(name) {
  ['login', 'register', 'forgot', 'app'].forEach(s => {
    document.getElementById(s === 'app' ? 'app' : `screen-${s}`).style.display = 'none';
  });
  if (name === 'app') {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('user-name-display').textContent = getName() || '';
    if (getRole() !== 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }
    init();
  } else {
    document.getElementById(`screen-${name}`).style.display = 'flex';
  }
}

document.getElementById('show-register').addEventListener('click', () => showScreen('register'));
document.getElementById('show-forgot').addEventListener('click', () => showScreen('forgot'));
document.getElementById('show-login-from-register').addEventListener('click', () => showScreen('login'));
document.getElementById('show-login-from-forgot').addEventListener('click', () => showScreen('login'));

// ---------- LOGIN ----------
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const res = await fetch(`${API}/auth-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login fehlgeschlagen'; return; }
    setToken(data.token); setRole(data.role); setName(data.name);
    showScreen('app');
  } catch {
    errEl.textContent = 'Verbindungsfehler';
  }
});

// ---------- REGISTER: Schritt 1, Code anfordern ----------
document.getElementById('request-code-btn').addEventListener('click', async () => {
  const email = document.getElementById('reg-request-email').value.trim();
  const errEl = document.getElementById('register-error');
  const okEl = document.getElementById('register-success');
  errEl.textContent = ''; okEl.textContent = '';
  if (!email) { errEl.textContent = 'Bitte E-Mail eingeben'; return; }
  try {
    const res = await fetch(`${API}/request-employee-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Fehler'; return; }
    okEl.textContent = 'Code wurde an deine E-Mail geschickt!';
    window._registerEmail = email;
    document.getElementById('register-step-1').style.display = 'none';
    document.getElementById('register-step-2').style.display = 'block';
  } catch {
    errEl.textContent = 'Verbindungsfehler';
  }
});

// ---------- REGISTER: Schritt 2, Konto erstellen ----------
document.getElementById('register-btn').addEventListener('click', async () => {
  const email = window._registerEmail;
  const code = document.getElementById('reg-code').value.trim();
  const name = document.getElementById('reg-name').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';
  try {
    const res = await fetch(`${API}/auth-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, name, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Registrierung fehlgeschlagen'; return; }
    setToken(data.token); setRole(data.role); setName(data.name);
    showScreen('app');
  } catch {
    errEl.textContent = 'Verbindungsfehler';
  }
});

// ---------- FORGOT PASSWORD ----------
document.getElementById('forgot-send-btn').addEventListener('click', async () => {
  const email = document.getElementById('forgot-email').value.trim();
  const errEl = document.getElementById('forgot-error');
  const okEl = document.getElementById('forgot-success');
  errEl.textContent = ''; okEl.textContent = '';
  try {
    await fetch(`${API}/auth-forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    okEl.textContent = 'Falls ein Konto existiert, wurde ein Code gesendet.';
    document.getElementById('forgot-step-1').style.display = 'none';
    document.getElementById('forgot-step-2').style.display = 'block';
    window._resetEmail = email;
  } catch {
    errEl.textContent = 'Verbindungsfehler';
  }
});

document.getElementById('forgot-reset-btn').addEventListener('click', async () => {
  const code = document.getElementById('forgot-code').value.trim();
  const newPassword = document.getElementById('forgot-new-password').value;
  const errEl = document.getElementById('forgot-error');
  const okEl = document.getElementById('forgot-success');
  errEl.textContent = ''; okEl.textContent = '';
  try {
    const res = await fetch(`${API}/auth-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window._resetEmail, code, newPassword })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Fehler'; return; }
    okEl.textContent = 'Passwort geändert! Du kannst dich jetzt einloggen.';
    setTimeout(() => showScreen('login'), 1500);
  } catch {
    errEl.textContent = 'Verbindungsfehler';
  }
});

// ---------- LOGOUT ----------
document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken();
  showScreen('login');
});

// ---------- BOTTOM NAV ----------
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
  try {
    usersCache = await apiCall('users');
    renderUserList();
  } catch {}
}

function renderUserList() {
  const list = document.getElementById('user-list');
  list.innerHTML = '';
  if (usersCache.length === 0) {
    list.innerHTML = '<p style="color:#666; font-size:13px; padding:8px;">Noch keine Nachrichten. Warte auf /start.</p>';
    return;
  }
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
  try {
    const { total, transactions } = await apiCall('revenue');
    document.getElementById('revenue-total').textContent = '€' + Number(total || 0).toFixed(2);
    const body = document.getElementById('tx-body');
    body.innerHTML = '';
    (transactions || []).forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date(t.createdAt).toLocaleString('de-DE')}</td><td>${t.name || '-'}</td><td>${t.amount} ${t.currency}</td>`;
      body.appendChild(tr);
    });
  } catch {}
}

// ---------- MITARBEITER-CODES (Admin, optional manuell) ----------
document.getElementById('generate-code-btn').addEventListener('click', async () => {
  const emailInput = document.getElementById('employee-email');
  const email = emailInput.value.trim();
  if (!email) return;
  try {
    await apiCall('employee-code', { method: 'POST', body: JSON.stringify({ email }) });
    emailInput.value = '';
    loadCodes();
  } catch {}
});

async function loadCodes() {
  try {
    const codes = await apiCall('employee-codes');
    const body = document.getElementById('codes-body');
    body.innerHTML = '';
    codes.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.code}</td><td>${c.email}</td><td>${c.used ? '✅ Benutzt' : '⏳ Offen'}</td>`;
      body.appendChild(tr);
    });
  } catch {}
}

// ---------- INIT ----------
let intervalsStarted = false;
function init() {
  loadUsers();
  loadRevenue();
  if (getRole() === 'admin') loadCodes();
  if (!intervalsStarted) {
    setInterval(loadUsers, 5000);
    setInterval(loadRevenue, 30000);
    intervalsStarted = true;
  }
}

// ---------- STARTUP ----------
(async () => {
  if (getToken()) {
    try { await apiCall('users'); showScreen('app'); return; } catch {}
  }
  showScreen('login');
})();
