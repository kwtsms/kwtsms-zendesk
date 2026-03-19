const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../db/connection');
const { encrypt } = require('../utils/crypto');
const { seedTenant } = require('../db/seeds');

// GET /oauth/authorize
router.get('/authorize', (req, res) => {
  const clientId = process.env.ZENDESK_CLIENT_ID;
  const redirectUri = process.env.ZENDESK_REDIRECT_URI;
  const subdomain = req.query.subdomain;

  if (!subdomain) {
    return res.status(400).send('Missing subdomain parameter');
  }

  const state = Buffer.from(JSON.stringify({ subdomain })).toString('base64');

  const authUrl = `https://${subdomain}.zendesk.com/oauth/authorizations/new?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `scope=${encodeURIComponent('read triggers:write webhooks:write')}&` +
    `state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
});

// GET /oauth/callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  let subdomain;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    subdomain = stateData.subdomain;
  } catch (e) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    const tokenResponse = await axios.post(
      `https://${subdomain}.zendesk.com/oauth/tokens`,
      {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.ZENDESK_CLIENT_ID,
        client_secret: process.env.ZENDESK_CLIENT_SECRET,
        redirect_uri: process.env.ZENDESK_REDIRECT_URI,
        scope: 'read triggers:write webhooks:write',
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM tenants WHERE subdomain = ?').get(subdomain);

    if (existing) {
      db.prepare(`
        UPDATE tenants SET oauth_token = ?, updated_at = datetime('now') WHERE id = ?
      `).run(encrypt(accessToken), existing.id);
    } else {
      const result = db.prepare(`
        INSERT INTO tenants (subdomain, oauth_token) VALUES (?, ?)
      `).run(subdomain, encrypt(accessToken));
      seedTenant(result.lastInsertRowid);
    }

    res.redirect(`https://${subdomain}.zendesk.com/agent/admin/apps`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// POST /lifecycle/uninstall
router.post('/uninstall', (req, res) => {
  const subdomain = req.body?.subdomain;

  if (subdomain) {
    const db = getDb();
    const tenant = db.prepare('SELECT id FROM tenants WHERE subdomain = ?').get(subdomain);
    if (tenant) {
      db.prepare('DELETE FROM tenants WHERE id = ?').run(tenant.id);
    }
  }

  res.status(200).json({ success: true });
});

module.exports = router;
