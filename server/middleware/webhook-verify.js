const crypto = require('crypto');

function webhookVerify(req, res, next) {
  const signature = req.headers['x-zendesk-webhook-signature'];
  const timestamp = req.headers['x-zendesk-webhook-signature-timestamp'];
  const secret = process.env.WEBHOOK_SIGNING_SECRET;

  if (!secret) {
    // No secret configured, skip verification in dev
    if (process.env.NODE_ENV === 'development') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
      return next();
    }
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const signedPayload = timestamp + req.body.toString();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    req.body = JSON.parse(req.body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  next();
}

module.exports = { webhookVerify };
