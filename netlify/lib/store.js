const { getStore } = require('@netlify/blobs');
const { getAuthUser } = require('./auth');

function store() {
  return getStore('keethbenzo-data');
}

async function getJSON(key, fallback) {
  const s = store();
  const val = await s.get(key, { type: 'json' });
  return val || fallback;
}

async function setJSON(key, value) {
  const s = store();
  await s.setJSON(key, value);
}

// Gibt den eingeloggten Nutzer zurück, oder null wenn nicht eingeloggt
function checkAuth(event) {
  return getAuthUser(event);
}

module.exports = { getJSON, setJSON, checkAuth };
