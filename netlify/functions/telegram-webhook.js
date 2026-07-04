const fetch = require('node-fetch');
const { getJSON, setJSON } = require('../lib/store');

exports.handler = async (event) => {
  const update = JSON.parse(event.body || '{}');
  const msg = update.message;
  if (!msg) return { statusCode: 200, body: 'ok' };

  const chatId = String(msg.chat.id);
  const users = await getJSON('users', {});

  if (!users[chatId]) {
    users[chatId] = {
      chatId,
      username: msg.from.username || msg.from.first_name || 'Unbekannt',
      firstSeen: new Date().toISOString(),
      messages: []
    };
  }
  users[chatId].messages.push({ from: 'user', text: msg.text || '[Media]', time: new Date().toISOString() });
  users[chatId].lastMessage = new Date().toISOString();
  await setJSON('users', users);

  if (msg.text === '/start') {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Willkommen bei KeethBenzo! 🖱️ Schreib uns, welches Produkt (Gaming Maus / Mousepad) und deine Versandadresse.'
      })
    });
  }

  return { statusCode: 200, body: 'ok' };
};
