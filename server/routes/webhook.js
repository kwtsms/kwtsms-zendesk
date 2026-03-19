const express = require('express');
const router = express.Router();
const { getDb } = require('../db/connection');
const { webhookVerify } = require('../middleware/webhook-verify');
const { processSms } = require('../services/sms');
const logger = require('../utils/logger');
const { LOG_SOURCES } = require('../utils/constants');

// POST /webhook/:subdomain/ticket-event
router.post('/:subdomain/ticket-event', webhookVerify, async (req, res) => {
  // Always return 200 to prevent Zendesk retry storms
  res.status(200).json({ received: true });

  const { subdomain } = req.params;
  const webhookData = req.body;

  try {
    const db = getDb();
    const tenant = db.prepare('SELECT * FROM tenants WHERE subdomain = ?').get(subdomain);

    if (!tenant) {
      console.error(`Webhook received for unknown subdomain: ${subdomain}`);
      return;
    }

    const eventType = webhookData.event_type;
    if (!eventType) {
      logger.warn(tenant.id, LOG_SOURCES.WEBHOOK, 'Missing event_type in webhook payload');
      return;
    }

    logger.debug(tenant.id, LOG_SOURCES.WEBHOOK, `Received: ${eventType}`, {
      ticketId: webhookData.ticket_id,
    });

    await processSms(tenant, eventType, webhookData);
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }
});

module.exports = router;
