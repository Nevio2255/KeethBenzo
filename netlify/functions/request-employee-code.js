const nodemailer = require('nodemailer');
const { getJSON, setJSON } = require('../lib/store');
const { generateShortCode } = require('../lib/auth');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'E-Mail erforderlich' }) };
  const normalizedEmail = email.trim().toLowerCase();

  const employees = await getJSON('employees', {});
  if (employees[normalizedEmail]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Für diese E-Mail existiert bereits ein Konto' }) };
  }

  const code = generateShortCode(6);
  const codes = await getJSON('employeeCodes', []);
  const filtered = codes.filter(c => c.email.toLowerCase() !== normalizedEmail || c.used);
  filtered.push({ code, email: normalizedEmail, createdAt: new Date().toISOString(), used: false });
  await setJSON('employeeCodes', filtered);

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
      subject: 'Dein KeethBenzo Mitarbeiter-Code',
      text: `Dein Code lautet: ${code}\nGib ihn zusammen mit deinem Namen und einem Passwort ein, um dein Konto zu erstellen.`
    });
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
