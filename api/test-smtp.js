var nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  console.log('test-smtp called');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');

  try {
    var transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP verified OK');

    console.log('Sending test email...');
    var result = await transporter.sendMail({
      from: '"BCP Test" <' + process.env.SMTP_USER + '>',
      to: process.env.SMTP_USER,
      subject: 'SMTP Test z Vercelu - ' + new Date().toISOString(),
      text: 'Ak vidis tento email, SMTP na Verceli funguje.'
    });
    console.log('Send result:', result.response);

    return res.json({ success: true, response: result.response });
  } catch (err) {
    console.error('SMTP test error:', err.message, err.code);
    return res.status(500).json({ success: false, error: err.message, code: err.code });
  }
};
