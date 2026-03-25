module.exports = function handler(req, res) {
  var clientId = process.env.OAUTH_CLIENT_ID;
  var redirectUri = 'https://www.bcpholding.sk/api/callback';
  var scope = 'repo,user';

  var authUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + clientId +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + scope;

  res.redirect(authUrl);
};
