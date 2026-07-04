const { getJSON } = require('../lib/store');
const { comparePassword, signToken } = require('../lib/auth');

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body || '{}');
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'E-Mail und Passwort erforderlich' }) };
  }
  const normalizedEmail = email.trim().toLowerCase();

  // Admin-Zugang direkt über Umgebungsvariablen (einmalig von dir gesetzt)
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (normalizedEmail === adminEmail && password === process.env.ADMIN_PASSWORD) {
    const token = signToken({ email: normalizedEmail, name: 'Admin', role: 'admin' });
    return { statusCode: 200, body: JSON.stringify({ token, name: 'Admin', role: 'admin' }) };
  }

  const employees = await getJSON('employees', {});
  const employee = employees[normalizedEmail];
  if (!employee || !comparePassword(password, employee.passwordHash)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'E-Mail oder Passwort falsch' }) };
  }

  const token = signToken({ email: normalizedEmail, name: employee.name, role: employee.role });
  return { statusCode: 200, body: JSON.stringify({ token, name: employee.name, role: employee.role }) };
};
