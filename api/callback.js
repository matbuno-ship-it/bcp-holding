var https = require('https');

module.exports = function handler(req, res) {
  var code = req.query.code;

  if (!code) {
    res.status(400).send('Missing code parameter');
    return;
  }

  var postData = JSON.stringify({
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    code: code
  });

  var options = {
    hostname: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var request = https.request(options, function (response) {
    var body = '';
    response.on('data', function (chunk) { body += chunk; });
    response.on('end', function () {
      try {
        var data = JSON.parse(body);

        if (data.error) {
          res.status(400).send('OAuth error: ' + data.error_description);
          return;
        }

        var token = data.access_token;
        var provider = 'github';

        var html =
          '<!DOCTYPE html><html><body><script>' +
          '(function() {' +
          '  function receiveMessage(e) {' +
          '    window.opener.postMessage(' +
          '      "authorization:' + provider + ':success:" + JSON.stringify({token:"' + token + '",provider:"' + provider + '"}),' +
          '      e.origin' +
          '    );' +
          '    window.removeEventListener("message", receiveMessage, false);' +
          '  }' +
          '  window.addEventListener("message", receiveMessage, false);' +
          '  window.opener.postMessage("authorizing:' + provider + '", "*");' +
          '})();' +
          '</script></body></html>';

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (err) {
        res.status(500).send('Parse error: ' + err.message);
      }
    });
  });

  request.on('error', function (err) {
    res.status(500).send('Request error: ' + err.message);
  });

  request.write(postData);
  request.end();
};
