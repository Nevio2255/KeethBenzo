const { getJSON, setJSON } = require('../lib/store');
const { generateShortCode } = require('../lib/auth');

async function sendMail(toEmail, code) {
  if (!process.env.EMAILJS_PRIVATE_KEY) return;
  await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: 'service_sngrgol',
      template_id: 'template_yxgtmtl',
      user_id: 'ildmgzLV9EhyPcTYd',
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        email: toEmail,
        code: code
      }
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

  await sendMail(normalizedEmail, code);

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
