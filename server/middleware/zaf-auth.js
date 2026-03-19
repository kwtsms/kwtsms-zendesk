const jwt = require('jsonwebtoken');
const { getDb } = require('../db/connection');

function zafAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decode JWT to extract subdomain
    // In production, verify against Zendesk's public key
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.iss) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Extract subdomain from iss (format: "https://subdomain.zendesk.com")
    const match = decoded.iss.match(/https?:\/\/(.+)\.zendesk\.com/);
    if (!match) {
      return res.status(401).json({ error: 'Invalid token issuer' });
    }

    const subdomain = match[1];
    const db = getDb();
    const tenant = db.prepare('SELECT * FROM tenants WHERE subdomain = ?').get(subdomain);

    if (!tenant) {
      return res.status(404).json({ error: 'Account not found' });
    }

    req.tenant = tenant;
    req.subdomain = subdomain;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = { zafAuth };
