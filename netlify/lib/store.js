const { getStore } = require('@netlify/blobs');

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

function checkAuth(event) {
  const header = event.headers['x-dashboard-password'];
  return header && header === process.env.DASHBOARD_PASSWORD;
}

module.exports = { getJSON, setJSON, checkAuth };
