var https = require('https');
var nodemailer = require('nodemailer');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var token = body.token;
  var name = (body.name || '').trim();
  var phone = (body.phone || '').trim();
  var email = (body.email || '').trim();
  var company = (body.company || '').trim();
  var projectType = (body.projectType || '').trim();
  var message = (body.message || '').trim();

  if (!token) {
    res.status(400).json({ error: 'Missing reCAPTCHA token' });
    return;
  }
  if (!name || !phone || !email || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Step 1: Verify reCAPTCHA
  var secret = process.env.RECAPTCHA_SECRET;
  var postData = 'secret=' + encodeURIComponent(secret) + '&response=' + encodeURIComponent(token);

  var options = {
    hostname: 'www.google.com',
    path: '/recaptcha/api/siteverify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var request = https.request(options, function (response) {
    var responseBody = '';
    response.on('data', function (chunk) { responseBody += chunk; });
    response.on('end', function () {
      try {
        var data = JSON.parse(responseBody);
        if (!data.success || (data.score || 0) < 0.5) {
          res.status(403).json({ success: false, error: 'reCAPTCHA verification failed' });
          return;
        }
        // Step 2: Send email
        sendEmail(name, phone, email, company, projectType, message, res);
      } catch (err) {
        res.status(500).json({ error: 'reCAPTCHA parse error' });
      }
    });
  });

  request.on('error', function () {
    res.status(500).json({ error: 'reCAPTCHA verification failed' });
  });

  request.write(postData);
  request.end();
};

function sendEmail(name, phone, email, company, projectType, message, res) {
  var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  var htmlBody = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">'
    + '<h2 style="color:#1a1a2e;border-bottom:2px solid #6c63ff;padding-bottom:10px;">Nov\u00fd dopyt z webu</h2>'
    + '<table style="width:100%;border-collapse:collapse;">'
    + row('Meno', name)
    + row('Telef\u00f3n', phone)
    + row('E-mail', '<a href="mailto:' + escHtml(email) + '">' + escHtml(email) + '</a>')
    + (company ? row('Spolo\u010dnos\u0165', company) : '')
    + (projectType ? row('Typ projektu', projectType) : '')
    + '</table>'
    + '<div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:8px;border-left:4px solid #6c63ff;">'
    + '<strong>Spr\u00e1va:</strong><br><br>' + escHtml(message).replace(/\n/g, '<br>')
    + '</div>'
    + '<p style="margin-top:20px;font-size:12px;color:#999;">Odoslan\u00e9 z kontaktn\u00e9ho formul\u00e1ra na bcpholding.sk</p>'
    + '</body></html>';

  var mailOptions = {
    from: '"BCP Holding web" <' + process.env.SMTP_USER + '>',
    to: process.env.SMTP_USER,
    replyTo: email,
    subject: 'Nov\u00fd dopyt z webu: ' + name,
    html: htmlBody
  };

  transporter.sendMail(mailOptions, function (err) {
    if (err) {
      console.error('SMTP error:', err.message);
      res.status(500).json({ success: false, error: 'Email sending failed' });
    } else {
      res.json({ success: true });
    }
  });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function row(label, value) {
  return '<tr><td style="padding:8px 12px;font-weight:bold;color:#555;width:140px;vertical-align:top;">' + label + '</td>'
    + '<td style="padding:8px 12px;">' + value + '</td></tr>';
}
