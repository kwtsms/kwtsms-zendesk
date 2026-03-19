const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');
const logger = require('../utils/logger');
const { LOG_SOURCES } = require('../utils/constants');

// GET /api/templates?locale=en
router.get('/', zafAuth, (req, res) => {
  const locale = req.query.locale || req.tenant.default_locale || 'en';
  const db = getDb();
  const templates = db.prepare(
    'SELECT * FROM templates WHERE tenant_id = ? AND locale = ? ORDER BY event_type'
  ).all(req.tenant.id, locale);
  res.json(templates);
});

// PUT /api/templates/:id
router.put('/:id', zafAuth, (req, res) => {
  const { body: templateBody, is_active } = req.body;
  const db = getDb();

  const template = db.prepare(
    'SELECT * FROM templates WHERE id = ? AND tenant_id = ?'
  ).get(req.params.id, req.tenant.id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const updates = [];
  const params = [];

  if (templateBody !== undefined) {
    updates.push('body = ?');
    params.push(templateBody);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id, req.tenant.id);

  db.prepare(
    `UPDATE templates SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
  ).run(...params);

  logger.log(req.tenant.id, LOG_SOURCES.SYSTEM, `Template updated: ${template.event_type}`, {
    templateId: template.id,
  });

  res.json({ success: true });
});

module.exports = router;
