const { getJSON, checkAuth } = require('../lib/store');

exports.handler = async (event) => {
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const users = await getJSON('users', {});
  const list = Object.values(users).sort(
    (a, b) => new Date(b.lastMessage || b.firstSeen) - new Date(a.lastMessage || a.firstSeen)
  );
  return { statusCode: 200, body: JSON.stringify(list) };
};
