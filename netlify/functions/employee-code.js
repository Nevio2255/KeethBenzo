const { getJSON, setJSON, checkAuth } = require('../lib/store');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: 'E-Mail erforderlich' };

  const code = generateCode();
  const codes = await getJSON('employeeCodes', []);
  codes.push({ code, email, createdAt: new Date().toISOString(), used: false });
  await setJSON('employeeCodes', codes);

  await sendMail(
    email,
    'Dein KeethBenzo Mitarbeiter-Code',
    `Willkommen im Team! Dein Zugangscode lautet: ${code}`
  );

  return { statusCode: 200, body: JSON.stringify({ code }) };
};
