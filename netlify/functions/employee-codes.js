const { getJSON, checkAuth } = require('../lib/store');

exports.handler = async (event) => {
  if (!checkAuth(event)) return { statusCode: 401, body: 'Unauthorized' };
  const codes = await getJSON('employeeCodes', []);
  return { statusCode: 200, body: JSON.stringify(codes) };
};
