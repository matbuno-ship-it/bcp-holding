module.exports = function handler(req, res) {
  res.json({
    hasClientId: !!process.env.OAUTH_CLIENT_ID,
    hasClientSecret: !!process.env.OAUTH_CLIENT_SECRET,
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(function(k) { return k.indexOf('OAUTH') > -1; })
  });
};
