exports.handler = async () => {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

  const info = {
    EMAIL_USER_gesetzt: !!process.env.EMAIL_USER,
    EMAIL_USER_länge: user.length,
    EMAIL_USER_hat_leerzeichen: /\s/.test(user),
    EMAIL_USER_endet_auf_gmail: user.toLowerCase().endsWith('@gmail.com'),

    EMAIL_PASS_gesetzt: !!process.env.EMAIL_PASS,
    EMAIL_PASS_länge: pass.length,
    EMAIL_PASS_hat_leerzeichen: /\s/.test(pass),
    EMAIL_PASS_erste_2_zeichen: pass.slice(0, 2),
    EMAIL_PASS_letzte_2_zeichen: pass.slice(-2)
  };

  return { statusCode: 200, body: JSON.stringify(info, null, 2) };
};
