const { getJSON, checkAuth } = require('../lib/store');

exports.handler = async (event) => {
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const total = await getJSON('revenue', 0);
  const transactions = await getJSON('coinbaseTransactions', []);
  return { statusCode: 200, body: JSON.stringify({ total, transactions }) };
};
