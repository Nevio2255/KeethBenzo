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
  if (employees[normalizedEmail]) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Für diese E-Mail existiert bereits ein Konto' }) };
  }

  const code = generateShortCode(6);
  const codes = await getJSON('employeeCodes', []);
  const filtered = codes.filter(c => c.email.toLowerCase() !== normalizedEmail || c.used);
  filtered.push({ code, email: normalizedEmail, createdAt: new Date().toISOString(), used: false });
  await setJSON('employeeCodes', filtered);

  await sendMail(
    normalizedEmail,
    'Dein KeethBenzo Mitarbeiter-Code',
    `Dein Code lautet: ${code}\nGib ihn zusammen mit deinem Namen und einem Passwort ein, um dein Konto zu erstellen.`
  );

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
