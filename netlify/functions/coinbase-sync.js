const fetch = require('node-fetch');
const { setJSON } = require('../lib/store');

exports.handler = async () => {
  if (!process.env.COINBASE_API_KEY) return { statusCode: 200, body: 'Kein Coinbase Key gesetzt' };

  try {
    const res = await fetch('https://api.commerce.coinbase.com/charges', {
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      }
    });
    const data = await res.json();
    if (!data.data) return { statusCode: 200, body: 'Keine Daten' };

    const transactions = data.data
      .filter(c => c.timeline?.some(t => t.status === 'COMPLETED'))
      .map(c => ({
        id: c.id,
        name: c.name,
        amount: c.pricing?.local?.amount,
        currency: c.pricing?.local?.currency,
        createdAt: c.created_at
      }));

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    await setJSON('coinbaseTransactions', transactions);
    await setJSON('revenue', total);
  } catch (err) {
    console.error('Coinbase Sync Fehler:', err.message);
  }
  return { statusCode: 200, body: 'ok' };
};
