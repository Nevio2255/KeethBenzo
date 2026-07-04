const { getJSON, setJSON } = require('../lib/store');
const { hashPassword } = require('../lib/auth');

exports.handler = async (event) => {
  const { email, code, newPassword } = JSON.parse(event.body || '{}');
  if (!email || !code || !newPassword) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Alle Felder sind erforderlich' }) };
  }
  const normalizedEmail = email.trim().toLowerCase();

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (normalizedEmail === adminEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Admin-Passwort kann nur direkt in den Netlify Umgebungsvariablen geändert werden' })
    };
  }

  const resetCodes = await getJSON('resetCodes', {});
  const entry = resetCodes[normalizedEmail];
  if (!entry || entry.code !== code.trim().toUpperCase() || entry.expires < Date.now()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Code ungültig oder abgelaufen' }) };
  }

  const employees = await getJSON('employees', {});
  if (!employees[normalizedEmail]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Kein Konto für diese E-Mail gefunden' }) };
  }

  employees[normalizedEmail].passwordHash = hashPassword(newPassword);
  await setJSON('employees', employees);

  delete resetCodes[normalizedEmail];
  await setJSON('resetCodes', resetCodes);

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
