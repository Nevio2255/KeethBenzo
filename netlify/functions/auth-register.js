const { getJSON, setJSON } = require('../lib/store');
const { hashPassword, signToken } = require('../lib/auth');

exports.handler = async (event) => {
  const { email, code, name, password } = JSON.parse(event.body || '{}');
  if (!email || !code || !name || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Alle Felder sind erforderlich' }) };
  }
  const normalizedEmail = email.trim().toLowerCase();

  const codes = await getJSON('employeeCodes', []);
  const codeEntry = codes.find(
    c => c.code === code.trim().toUpperCase() && c.email.toLowerCase() === normalizedEmail
  );
  if (!codeEntry) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger Code oder E-Mail stimmt nicht überein' }) };
  }
  if (codeEntry.used) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dieser Code wurde bereits verwendet' }) };
  }

  const employees = await getJSON('employees', {});
  if (employees[normalizedEmail]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Für diese E-Mail existiert bereits ein Konto' }) };
  }

  employees[normalizedEmail] = {
    email: normalizedEmail,
    name,
    passwordHash: hashPassword(password),
    role: 'employee',
    createdAt: new Date().toISOString()
  };
  await setJSON('employees', employees);

  codeEntry.used = true;
  codeEntry.usedAt = new Date().toISOString();
  await setJSON('employeeCodes', codes);

  const token = signToken({ email: normalizedEmail, name, role: 'employee' });
  return { statusCode: 200, body: JSON.stringify({ token, name, role: 'employee' }) };
};
