const { getStore } = require('@netlify/blobs');
const { getAuthUser } = require('./auth');

function store() {
  // Falls Netlify die Blobs-Umgebung nicht automatisch bereitstellt,
  // manuell mit Site ID + Token konfigurieren
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_TOKEN) {
    return getStore({
      name: 'keethbenzo-data',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN
    });
  }
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
