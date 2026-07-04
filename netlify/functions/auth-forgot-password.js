const nodemailer = require('nodemailer');
const { getJSON, setJSON } = require('../lib/store');
const { generateShortCode } = require('../lib/auth');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'E-Mail erforderlich' }) };
  const normalizedEmail = email.trim().toLowerCase();

  const employees = await getJSON('employees', {});
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const accountExists = employees[normalizedEmail] || normalizedEmail === adminEmail;

  // Immer "ok" zurückgeben, egal ob das Konto existiert (verhindert E-Mail-Erraten)
  if (!accountExists) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const resetCode = generateShortCode(6);
  const resetCodes = await getJSON('resetCodes', {});
  resetCodes[normalizedEmail] = { code: resetCode, expires: Date.now() + 1000 * 60 * 15 };
  await setJSON('resetCodes', resetCodes);

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.web.de',
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'KeethBenzo – Passwort zurücksetzen',
      text: `Dein Reset-Code lautet: ${resetCode}\nGültig für 15 Minuten.`
    });
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
