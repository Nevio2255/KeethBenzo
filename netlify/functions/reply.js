const fetch = require('node-fetch');
const { getJSON, setJSON, checkAuth } = require('../lib/store');

exports.handler = async (event) => {
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const { chatId, text } = JSON.parse(event.body || '{}');
  if (!chatId || !text) return { statusCode: 400, body: 'chatId und text erforderlich' };

  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  const users = await getJSON('users', {});
  if (users[chatId]) {
    users[chatId].messages.push({ from: 'admin', text, time: new Date().toISOString() });
    await setJSON('users', users);
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
