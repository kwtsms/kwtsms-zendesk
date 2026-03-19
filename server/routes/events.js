const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');
const { decrypt } = require('../utils/crypto');
const triggerManager = require('../services/trigger-manager');
const logger = require('../utils/logger');
const { LOG_SOURCES, EVENT_LABELS } = require('../utils/constants');

// GET /api/events
router.get('/', zafAuth, (req, res) => {
  const db = getDb();
  const toggles = db.prepare(
    'SELECT event_type, is_enabled, recipient_type FROM event_toggles WHERE tenant_id = ?'
  ).all(req.tenant.id);

  const enriched = toggles.map((t) => ({
    ...t,
    is_enabled: !!t.is_enabled,
    label: EVENT_LABELS[t.event_type] || t.event_type,
  }));

  res.json(enriched);
});

// PUT /api/events/:event_type
router.put('/:event_type', zafAuth, async (req, res) => {
  const { event_type } = req.params;
  const { is_enabled } = req.body;
  const tenant = req.tenant;
  const db = getDb();

  const toggle = db.prepare(
    'SELECT * FROM event_toggles WHERE tenant_id = ? AND event_type = ?'
  ).get(tenant.id, event_type);

  if (!toggle) {
    return res.status(404).json({ error: 'Event type not found' });
  }

  if (is_enabled && (!tenant.kwtsms_user || !tenant.kwtsms_pass)) {
    return res.status(400).json({ error: 'Gateway not connected. Please login first.' });
  }

  try {
    const oauthToken = decrypt(tenant.oauth_token);

    if (is_enabled && !toggle.is_enabled) {
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;
      const webhookId = await triggerManager.ensureWebhook(
        tenant.subdomain, oauthToken, webhookBaseUrl
      );

      // Save webhook_id to tenant
      db.prepare('UPDATE tenants SET webhook_id = ? WHERE id = ?')
        .run(webhookId, tenant.id);

      const trigger = await triggerManager.createTrigger(
        tenant.subdomain, oauthToken, event_type, webhookId
      );

      db.prepare(
        'UPDATE event_toggles SET is_enabled = 1, trigger_id = ? WHERE tenant_id = ? AND event_type = ?'
      ).run(String(trigger.id), tenant.id, event_type);

      logger.log(tenant.id, LOG_SOURCES.TRIGGER, `Enabled: ${event_type}`, {
        triggerId: trigger.id,
      });
    } else if (!is_enabled && toggle.is_enabled) {
      if (toggle.trigger_id) {
        await triggerManager.deleteTrigger(tenant.subdomain, oauthToken, toggle.trigger_id);
      }

      db.prepare(
        'UPDATE event_toggles SET is_enabled = 0, trigger_id = \'\' WHERE tenant_id = ? AND event_type = ?'
      ).run(tenant.id, event_type);

      logger.log(tenant.id, LOG_SOURCES.TRIGGER, `Disabled: ${event_type}`);
    }

    res.json({ success: true, event_type, is_enabled: !!is_enabled });
  } catch (err) {
    logger.error(tenant.id, LOG_SOURCES.TRIGGER, `Toggle failed: ${event_type}`, {
      error: err.message,
    });
    res.status(500).json({ error: 'Failed to update event toggle' });
  }
});

module.exports = router;
