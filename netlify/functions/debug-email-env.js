exports.handler = async () => {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  const emailjsKey = process.env.EMAILJS_PRIVATE_KEY || '';

  const info = {
    EMAIL_USER_gesetzt: !!process.env.EMAIL_USER,
    EMAIL_USER_länge: user.length,
    EMAIL_USER_hat_leerzeichen: /\s/.test(user),
    EMAIL_USER_endet_auf_gmail: user.toLowerCase().endsWith('@gmail.com'),

    EMAIL_PASS_gesetzt: !!process.env.EMAIL_PASS,
    EMAIL_PASS_länge: pass.length,
    EMAIL_PASS_hat_leerzeichen: /\s/.test(pass),

    EMAILJS_PRIVATE_KEY_gesetzt: !!process.env.EMAILJS_PRIVATE_KEY,
    EMAILJS_PRIVATE_KEY_länge: emailjsKey.length,
    EMAILJS_PRIVATE_KEY_hat_leerzeichen: /\s/.test(emailjsKey)
  };

  return { statusCode: 200, body: JSON.stringify(info, null, 2) };
};
