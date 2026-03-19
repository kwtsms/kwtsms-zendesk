const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');

// GET /api/logs?event_type=&status=&page=1&per_page=50
router.get('/', zafAuth, (req, res) => {
  const db = getDb();
  const tenantId = req.tenant.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page) || 50));
  const offset = (page - 1) * perPage;

  let where = 'WHERE tenant_id = ?';
  const params = [tenantId];

  if (req.query.event_type) {
    where += ' AND event_type = ?';
    params.push(req.query.event_type);
  }
  if (req.query.status) {
    where += ' AND status = ?';
    params.push(req.query.status);
  }

  const total = db.prepare(`SELECT count(*) as count FROM sms_logs ${where}`).get(...params);

  const logs = db.prepare(`
    SELECT * FROM sms_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, perPage, offset);

  res.json({
    logs,
    pagination: {
      page,
      per_page: perPage,
      total: total.count,
      total_pages: Math.ceil(total.count / perPage),
    },
  });
});

// DELETE /api/logs
router.delete('/', zafAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM sms_logs WHERE tenant_id = ?').run(req.tenant.id);
  db.prepare('DELETE FROM debug_logs WHERE tenant_id = ?').run(req.tenant.id);
  res.json({ success: true });
});

module.exports = router;
