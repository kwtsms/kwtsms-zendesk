const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');
const { EVENT_LABELS } = require('../utils/constants');

// GET /api/dashboard
router.get('/', zafAuth, (req, res) => {
  const db = getDb();
  const tenantId = req.tenant.id;

  const sentToday = db.prepare(`
    SELECT count(*) as count FROM sms_logs
    WHERE tenant_id = ? AND status = 'sent' AND date(created_at) = date('now')
  `).get(tenantId);

  const failedRecent = db.prepare(`
    SELECT count(*) as count FROM sms_logs
    WHERE tenant_id = ? AND status = 'failed'
    AND created_at >= datetime('now', '-1 day')
  `).get(tenantId);

  const skippedRecent = db.prepare(`
    SELECT count(*) as count FROM sms_logs
    WHERE tenant_id = ? AND status = 'skipped'
    AND created_at >= datetime('now', '-1 day')
  `).get(tenantId);

  const toggles = db.prepare(
    'SELECT event_type, is_enabled, recipient_type FROM event_toggles WHERE tenant_id = ?'
  ).all(tenantId);

  const enriched = toggles.map((t) => ({
    ...t,
    is_enabled: !!t.is_enabled,
    label: EVENT_LABELS[t.event_type] || t.event_type,
  }));

  const isConnected = !!(req.tenant.kwtsms_user && req.tenant.kwtsms_pass);

  res.json({
    is_connected: isConnected,
    is_enabled: !!req.tenant.is_enabled,
    test_mode: !!req.tenant.test_mode,
    balance: req.tenant.balance || 0,
    sent_today: sentToday.count,
    failed_24h: failedRecent.count,
    skipped_24h: skippedRecent.count,
    toggles: enriched,
  });
});

module.exports = router;
