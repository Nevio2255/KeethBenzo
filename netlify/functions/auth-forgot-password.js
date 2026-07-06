const { getJSON, setJSON } = require('../lib/store');
const { generateShortCode } = require('../lib/auth');

async function sendMail(to, subject, text) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'KeethBenzo <onboarding@resend.dev>',
      to,
      subject,
      text
    })
  });
}

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'E-Mail erforderlich' }) };
  const normalizedEmail = email.trim().toLowerCase();

  const employees = await getJSON('employees', {});
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const accountExists = employees[normalizedEmail] || normalizedEmail === adminEmail;

  if (!accountExists) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const resetCode = generateShortCode(6);
  const resetCodes = await getJSON('resetCodes', {});
  resetCodes[normalizedEmail] = { code: resetCode, expires: Date.now() + 1000 * 60 * 15 };
  await setJSON('resetCodes', resetCodes);

  await sendMail(
    normalizedEmail,
    'KeethBenzo – Passwort zurücksetzen',
    `Dein Reset-Code lautet: ${resetCode}\nGültig für 15 Minuten.`
  );

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
