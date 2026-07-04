const nodemailer = require('nodemailer');
const { getJSON, setJSON, checkAuth } = require('../lib/store');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

exports.handler = async (event) => {
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: 'E-Mail erforderlich' };

  const code = generateCode();
  const codes = await getJSON('employeeCodes', []);
  codes.push({ code, email, createdAt: new Date().toISOString() });
  await setJSON('employeeCodes', codes);

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.web.de',
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Dein KeethBenzo Mitarbeiter-Code',
      text: `Willkommen im Team! Dein Zugangscode lautet: ${code}`
    });
  }
  return { statusCode: 200, body: JSON.stringify({ code }) };
};
