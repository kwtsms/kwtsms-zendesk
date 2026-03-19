const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { encrypt } = require('../utils/crypto');
const { zafAuth } = require('../middleware/zaf-auth');
const kwtsms = require('../services/kwtsms');
const logger = require('../utils/logger');
const { LOG_SOURCES } = require('../utils/constants');

// POST /api/auth/login
router.post('/login', zafAuth, async (req, res) => {
  const { username, password } = req.body;
  const tenant = req.tenant;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const balanceResult = await kwtsms.checkBalance(username, password);

    if (balanceResult.result === 'ERROR') {
      logger.error(tenant.id, LOG_SOURCES.AUTH, 'Login failed: invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const db = getDb();
    db.prepare(`
      UPDATE tenants
      SET kwtsms_user = ?, kwtsms_pass = ?, balance = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(encrypt(username), encrypt(password), balanceResult.available, tenant.id);

    // Fetch and cache SenderIDs
    const senderIds = await kwtsms.getSenderIds(username, password);
    db.prepare('DELETE FROM sender_ids WHERE tenant_id = ?').run(tenant.id);
    for (const sid of senderIds) {
      const name = typeof sid === 'string' ? sid : sid.name || '';
      if (name) {
        db.prepare(
          'INSERT INTO sender_ids (tenant_id, name, status, synced_at) VALUES (?, ?, ?, datetime(\'now\'))'
        ).run(tenant.id, name, 'active');
      }
    }

    // Fetch and cache coverage
    const coverage = await kwtsms.getCoverage(username, password);
    db.prepare('DELETE FROM coverage WHERE tenant_id = ?').run(tenant.id);
    for (const c of coverage) {
      db.prepare(
        'INSERT INTO coverage (tenant_id, country_code, country_name, prefix, rate, synced_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
      ).run(
        tenant.id,
        c.country_code || c.code || '',
        c.country_name || c.country || '',
        c.prefix || c.mobile_prefix || '',
        parseFloat(c.rate || c.price || 0)
      );
    }

    logger.log(tenant.id, LOG_SOURCES.AUTH, 'Login successful', {
      balance: balanceResult.available,
      senderIds: senderIds.length,
      coverage: coverage.length,
    });

    res.json({
      success: true,
      balance: balanceResult.available,
      senderIds: senderIds.length,
      coverage: coverage.length,
    });
  } catch (err) {
    logger.error(tenant.id, LOG_SOURCES.AUTH, 'Login error', { error: err.message });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /api/auth/logout
router.post('/logout', zafAuth, async (req, res) => {
  const tenant = req.tenant;

  try {
    const db = getDb();

    // Delete Zendesk triggers (best effort)
    const toggles = db.prepare(
      'SELECT * FROM event_toggles WHERE tenant_id = ? AND trigger_id != \'\''
    ).all(tenant.id);

    if (toggles.length > 0 && tenant.oauth_token) {
      const { decrypt } = require('../utils/crypto');
      const oauthToken = decrypt(tenant.oauth_token);
      const triggerManager = require('../services/trigger-manager');
      for (const toggle of toggles) {
        try {
          await triggerManager.deleteTrigger(tenant.subdomain, oauthToken, toggle.trigger_id);
        } catch (err) {
          // Best effort, continue
        }
      }
    }

    // Clear credentials and reset
    db.prepare(`
      UPDATE tenants
      SET kwtsms_user = '', kwtsms_pass = '', sender_id = '', balance = 0,
          is_enabled = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(tenant.id);

    db.prepare(
      'UPDATE event_toggles SET is_enabled = 0, trigger_id = \'\' WHERE tenant_id = ?'
    ).run(tenant.id);

    db.prepare('DELETE FROM sender_ids WHERE tenant_id = ?').run(tenant.id);
    db.prepare('DELETE FROM coverage WHERE tenant_id = ?').run(tenant.id);

    logger.log(tenant.id, LOG_SOURCES.AUTH, 'Logged out, credentials cleared');
    res.json({ success: true });
  } catch (err) {
    logger.error(tenant.id, LOG_SOURCES.AUTH, 'Logout error', { error: err.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
