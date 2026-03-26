var https = require('https');
var nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }
  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Step 1: Verify reCAPTCHA
  try {
    var captchaResult = await verifyRecaptcha(token);
    if (!captchaResult.success || (captchaResult.score || 0) < 0.5) {
      console.log('reCAPTCHA failed, score:', captchaResult.score);
      return res.status(403).json({ success: false, error: 'reCAPTCHA verification failed' });
    }
    console.log('reCAPTCHA passed, score:', captchaResult.score);
  } catch (err) {
    console.error('reCAPTCHA error:', err.message);
    return res.status(500).json({ error: 'reCAPTCHA verification failed' });
  }

  // Step 2: Send emails
  try {
    await sendEmails(name, phone, email, company, projectType, message);
    console.log('All emails sent successfully');
    return res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ success: false, error: 'Email sending failed' });
  }
};

function verifyRecaptcha(token) {
  return new Promise(function (resolve, reject) {
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
      var body = '';
      response.on('data', function (chunk) { body += chunk; });
      response.on('end', function () {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error('Failed to parse reCAPTCHA response'));
        }
      });
    });

    request.on('error', reject);
    request.write(postData);
    request.end();
  });
}

async function sendEmails(name, phone, email, company, projectType, message) {
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

  console.log('SMTP config:', process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.SMTP_USER ? 'user-set' : 'user-missing');

  var firstName = name.split(' ')[0];

  // --- Admin notification email ---
  var adminHtml = wrapper(
    '<div style="text-align:center;padding:30px 0 20px;">'
    + '<h1 style="color:#ffffff;font-size:22px;margin:0;">Nov\u00fd dopyt z webu</h1>'
    + '<p style="color:#a990ff;font-size:14px;margin:8px 0 0;">Prijat\u00fd ' + formatDate() + '</p>'
    + '</div>'

    + '<div style="background:#ffffff;border-radius:12px;padding:28px 32px;margin:0 20px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + adminRow('Meno', name)
    + adminRow('Telef\u00f3n', '<a href="tel:' + escHtml(phone) + '" style="color:#6e45ff;text-decoration:none;">' + escHtml(phone) + '</a>')
    + adminRow('E-mail', '<a href="mailto:' + escHtml(email) + '" style="color:#6e45ff;text-decoration:none;">' + escHtml(email) + '</a>')
    + (company ? adminRow('Spolo\u010dnos\u0165', company) : '')
    + (projectType ? adminRow('Typ projektu', '<span style="background:#f0ecff;color:#6e45ff;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600;">' + escHtml(projectType) + '</span>') : '')
    + '</table>'

    + '<div style="margin-top:20px;padding:16px 20px;background:#f8f7ff;border-radius:8px;border-left:4px solid #6e45ff;">'
    + '<p style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;font-weight:700;">Spr\u00e1va</p>'
    + '<p style="color:#1a1a2e;font-size:14px;line-height:1.7;margin:0;">' + escHtml(message).replace(/\n/g, '<br>') + '</p>'
    + '</div>'

    + '<div style="text-align:center;padding-top:24px;">'
    + '<a href="mailto:' + escHtml(email) + '" style="display:inline-block;background:#6e45ff;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Odpoveda\u0165 z\u00e1kazn\u00edkovi</a>'
    + '</div>'
    + '</div>'
  );

  // --- Confirmation email to customer ---
  var confirmHtml = wrapper(
    '<div style="text-align:center;padding:30px 0 20px;">'
    + '<h1 style="color:#ffffff;font-size:22px;margin:0;">\u010eakujeme za v\u00e1\u0161 dopyt!</h1>'
    + '<p style="color:#3dfd98;font-size:14px;margin:8px 0 0;">V\u00e1\u0161 dopyt sme \u00faspe\u0161ne prijali</p>'
    + '</div>'

    + '<div style="background:#ffffff;border-radius:12px;padding:28px 32px;margin:0 20px;">'
    + '<p style="color:#1a1a2e;font-size:15px;line-height:1.7;margin:0 0 20px;">Dobr\u00fd de\u0148, <strong>' + escHtml(firstName) + '</strong>,</p>'
    + '<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">Potvrzujeme prijatie va\u0161ej spr\u00e1vy. N\u00e1\u0161 t\u00edm sa v\u00e1m ozve <strong>do 24 hod\u00edn</strong> v pracovn\u00fdch d\u0148och.</p>'

    + '<div style="background:#f8f7ff;border-radius:8px;padding:16px 20px;margin-bottom:20px;">'
    + '<p style="color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;font-weight:700;">S\u00fahrn v\u00e1\u0161ho dopytu</p>'
    + '<table style="width:100%;border-collapse:collapse;">'
    + confirmRow('Typ projektu', projectType || '\u2014')
    + confirmRow('Spr\u00e1va', escHtml(message).replace(/\n/g, '<br>'))
    + '</table>'
    + '</div>'

    + '<div style="background:linear-gradient(135deg,#07001f,#0a0028);border-radius:10px;padding:20px 24px;text-align:center;">'
    + '<p style="color:#a990ff;font-size:13px;margin:0 0 4px;font-weight:600;">Medzit\u00fdm n\u00e1s m\u00f4\u017eete kontaktova\u0165</p>'
    + '<p style="margin:8px 0 4px;"><a href="tel:+421910455300" style="color:#3dfd98;text-decoration:none;font-size:16px;font-weight:700;">+421 910 455 300</a></p>'
    + '<p style="margin:4px 0 0;"><a href="mailto:info@bcpholding.sk" style="color:#a990ff;text-decoration:none;font-size:13px;">info@bcpholding.sk</a></p>'
    + '</div>'
    + '</div>'
  );

  // Send admin email
  console.log('Sending admin email...');
  var adminResult = await transporter.sendMail({
    from: '"BCP Holding" <' + process.env.SMTP_USER + '>',
    to: process.env.SMTP_USER,
    replyTo: email,
    subject: '\u270f\ufe0f Nov\u00fd dopyt: ' + name + (projectType ? ' \u2014 ' + projectType : ''),
    html: adminHtml
  });
  console.log('Admin email sent:', adminResult.response);

  // Send confirmation email
  console.log('Sending confirmation email to:', email);
  var confirmResult = await transporter.sendMail({
    from: '"BCP HOLDING" <' + process.env.SMTP_USER + '>',
    to: email,
    subject: 'Potvrdenie dopytu \u2014 BCP HOLDING',
    html: confirmHtml
  });
  console.log('Confirmation email sent:', confirmResult.response);
}

// --- Email template helpers ---

function wrapper(content) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#f0ecff;font-family:Arial,Helvetica,sans-serif;">'
    + '<div style="max-width:600px;margin:0 auto;padding:20px 0;">'
    + '<div style="text-align:center;padding:16px 0;">'
    + '<span style="font-size:20px;font-weight:800;letter-spacing:0.04em;color:#6e45ff;">BCP</span>'
    + '<span style="font-size:20px;font-weight:300;letter-spacing:0.04em;color:#6e45ff;"> HOLDING</span>'
    + '</div>'
    + '<div style="background:linear-gradient(180deg,#07001f 0%,#0a0028 100%);border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(110,69,255,0.15);">'
    + content
    + '<div style="text-align:center;padding:20px;border-top:1px solid rgba(255,255,255,0.06);">'
    + '<p style="color:#9895a1;font-size:11px;margin:0;">BCP HOLDING s.r.o. &bull; Elektroin\u0161tal\u00e1cie &bull; KS &bull; EPS &bull; Smart syst\u00e9my</p>'
    + '<p style="color:#9895a1;font-size:11px;margin:4px 0 0;"><a href="https://www.bcpholding.sk" style="color:#a990ff;text-decoration:none;">www.bcpholding.sk</a></p>'
    + '</div>'
    + '</div>'
    + '</div></body></html>';
}

function adminRow(label, value) {
  return '<tr>'
    + '<td style="padding:10px 0;color:#9895a1;font-size:13px;font-weight:600;width:120px;vertical-align:top;border-bottom:1px solid #f0ecff;">' + label + '</td>'
    + '<td style="padding:10px 0;color:#1a1a2e;font-size:14px;border-bottom:1px solid #f0ecff;">' + value + '</td>'
    + '</tr>';
}

function confirmRow(label, value) {
  return '<tr>'
    + '<td style="padding:6px 0;color:#9895a1;font-size:12px;font-weight:600;width:110px;vertical-align:top;">' + label + '</td>'
    + '<td style="padding:6px 0;color:#1a1a2e;font-size:13px;line-height:1.6;">' + value + '</td>'
    + '</tr>';
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate() {
  var d = new Date();
  var days = ['nede\u013ea','pondelok','utorok','streda','\u0161tvrtok','piatok','sobota'];
  var months = ['janu\u00e1ra','febru\u00e1ra','marca','apr\u00edla','m\u00e1ja','j\u00fana','j\u00fala','augusta','septembra','okt\u00f3bra','novembra','decembra'];
  return days[d.getDay()] + ' ' + d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
