const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { zafAuth } = require('../middleware/zaf-auth');

// GET /api/senderids
router.get('/', zafAuth, (req, res) => {
  const db = getDb();
  const senderIds = db.prepare('SELECT name, status FROM sender_ids WHERE tenant_id = ?')
    .all(req.tenant.id);
  res.json(senderIds);
});

module.exports = router;
