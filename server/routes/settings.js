const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');
const logger = require('../utils/logger');
const { LOG_SOURCES } = require('../utils/constants');

const ALLOWED_SETTINGS = ['is_enabled', 'test_mode', 'debug_logging', 'sender_id', 'default_locale', 'company_name'];

// GET /api/settings
router.get('/', zafAuth, (req, res) => {
  const tenant = req.tenant;
  const isConnected = !!(tenant.kwtsms_user && tenant.kwtsms_pass);

  res.json({
    is_enabled: !!tenant.is_enabled,
    test_mode: !!tenant.test_mode,
    debug_logging: !!tenant.debug_logging,
    sender_id: tenant.sender_id || '',
    default_locale: tenant.default_locale || 'en',
    company_name: tenant.company_name || '',
    is_connected: isConnected,
    balance: tenant.balance || 0,
  });
});

// PUT /api/settings
router.put('/', zafAuth, (req, res) => {
  const tenant = req.tenant;
  const { key, value } = req.body;

  if (!key || !ALLOWED_SETTINGS.includes(key)) {
    return res.status(400).json({ error: 'Invalid setting' });
  }

  const db = getDb();
  const dbValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;

  db.prepare(`UPDATE tenants SET ${key} = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(dbValue, tenant.id);

  logger.log(tenant.id, LOG_SOURCES.SYSTEM, `Setting updated: ${key}`, { value: dbValue });
  res.json({ success: true, key, value: dbValue });
});

module.exports = router;
