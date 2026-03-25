export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = 'https://www.bcpholding.sk/api/callback';
  const scope = 'repo,user';

  const authUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + clientId +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + scope;

  res.redirect(authUrl);
}
