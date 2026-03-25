var https = require('https');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var token = req.body && req.body.token;
  if (!token) {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

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
        var data = JSON.parse(body);
        res.json({
          success: data.success && data.score >= 0.5,
          score: data.score || 0
        });
      } catch (err) {
        res.status(500).json({ error: 'Parse error' });
      }
    });
  });

  request.on('error', function () {
    res.status(500).json({ error: 'Verification failed' });
  });

  request.write(postData);
  request.end();
};
