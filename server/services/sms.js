const { getDb } = require('../db/connection');
const { decrypt } = require('../utils/crypto');
const { normalize, verify, deduplicate } = require('./phone');
const { cleanMessage, renderTemplate } = require('./message');
const kwtsms = require('./kwtsms');
const logger = require('../utils/logger');
const { SMS_STATUS, LOG_SOURCES } = require('../utils/constants');

async function processSms(tenant, eventType, webhookData) {
  const db = getDb();

  // Gate 1: Master switch
  if (!tenant.is_enabled) {
    logger.debug(tenant.id, LOG_SOURCES.SEND, 'Skipped: gateway disabled');
    return { status: SMS_STATUS.SKIPPED, reason: 'gateway disabled' };
  }

  // Gate 2: Credentials exist
  if (!tenant.kwtsms_user || !tenant.kwtsms_pass) {
    logger.debug(tenant.id, LOG_SOURCES.SEND, 'Skipped: not connected');
    return { status: SMS_STATUS.SKIPPED, reason: 'not connected' };
  }

  // Gate 3: Event toggle on
  const toggle = db.prepare(
    'SELECT * FROM event_toggles WHERE tenant_id = ? AND event_type = ? AND is_enabled = 1'
  ).get(tenant.id, eventType);

  if (!toggle) {
    logger.debug(tenant.id, LOG_SOURCES.SEND, `Skipped: event ${eventType} disabled`);
    return { status: SMS_STATUS.SKIPPED, reason: 'event disabled' };
  }

  // Determine recipient phone
  const recipientPhone = webhookData.requester_phone || '';
  if (!recipientPhone) {
    return logSms(db, tenant, eventType, '', SMS_STATUS.SKIPPED, 'no phone number', '', webhookData);
  }

  // Normalize and verify
  const normalizedPhone = normalize(recipientPhone);
  if (!verify(normalizedPhone)) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, 'invalid phone', '', webhookData);
  }

  // Load template
  const template = db.prepare(
    'SELECT * FROM templates WHERE tenant_id = ? AND event_type = ? AND locale = ? AND is_active = 1'
  ).get(tenant.id, eventType, tenant.default_locale || 'en');

  if (!template) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, 'no active template', '', webhookData);
  }

  // Render template
  const templateData = {
    'ticket.id': webhookData.ticket_id || '',
    'ticket.subject': webhookData.ticket_subject || '',
    'requester.name': webhookData.requester_name || '',
    'requester.phone': webhookData.requester_phone || '',
    'agent.name': webhookData.assignee_name || webhookData.current_user_name || '',
    'status': webhookData.ticket_status || '',
    'company.name': tenant.company_name || '',
  };

  let messageBody;
  try {
    messageBody = renderTemplate(template.body, templateData);
    messageBody = cleanMessage(messageBody);
  } catch (err) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.FAILED, 'template render error: ' + err.message, '', webhookData);
  }

  if (!messageBody.trim()) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, 'empty message after render', '', webhookData);
  }

  // Check balance
  if (tenant.balance <= 0) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, 'no balance', '', webhookData);
  }

  // Check coverage
  const coverageMatch = db.prepare(
    'SELECT * FROM coverage WHERE tenant_id = ? AND ? LIKE prefix || \'%\''
  ).get(tenant.id, normalizedPhone);

  if (!coverageMatch) {
    const prefix = normalizedPhone.substring(0, 3);
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, `no coverage for prefix ${prefix}`, '', webhookData);
  }

  // Deduplicate: skip if same phone+ticket+event sent in last 5 minutes
  const recentDupe = db.prepare(`
    SELECT id FROM sms_logs
    WHERE tenant_id = ? AND ticket_id = ? AND event_type = ? AND recipient_phone = ? AND status = 'sent'
    AND created_at >= datetime('now', '-5 minutes')
  `).get(tenant.id, webhookData.ticket_id || '', eventType, normalizedPhone);

  if (recentDupe) {
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SKIPPED, 'duplicate (sent in last 5 min)', '', webhookData);
  }

  // Send SMS
  try {
    const username = decrypt(tenant.kwtsms_user);
    const password = decrypt(tenant.kwtsms_pass);

    const result = await kwtsms.sendSms({
      username,
      password,
      sender: tenant.sender_id || 'KWT-SMS',
      mobile: normalizedPhone,
      message: messageBody,
      test: tenant.test_mode ? 1 : 0,
    });

    const apiResponse = JSON.stringify(result);

    // Update cached balance from send response
    if (result['balance-after'] !== undefined) {
      db.prepare('UPDATE tenants SET balance = ? WHERE id = ?')
        .run(parseFloat(result['balance-after']), tenant.id);
    }

    if (result.result === 'OK') {
      logger.log(tenant.id, LOG_SOURCES.SEND, `SMS sent to ${normalizedPhone}`, {
        eventType, ticketId: webhookData.ticket_id, testMode: tenant.test_mode,
        msgId: result['msg-id'],
      });
      return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.SENT, '', apiResponse, webhookData, messageBody);
    } else {
      logger.error(tenant.id, LOG_SOURCES.SEND, `SMS failed: ${result.code || 'unknown'}`, {
        phone: normalizedPhone, eventType, error: result.description,
      });
      return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.FAILED, result.description || result.code || 'unknown error', apiResponse, webhookData, messageBody);
    }
  } catch (err) {
    logger.error(tenant.id, LOG_SOURCES.SEND, `SMS failed: ${err.message}`, {
      phone: normalizedPhone, eventType,
    });
    return logSms(db, tenant, eventType, normalizedPhone, SMS_STATUS.FAILED, err.message, '', webhookData, messageBody);
  }
}

function logSms(db, tenant, eventType, phone, status, errorMsg, apiResponse, webhookData, messageBody) {
  db.prepare(`
    INSERT INTO sms_logs (tenant_id, ticket_id, event_type, recipient_phone, message_body, sender_id, status, error_message, api_response, test_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenant.id,
    webhookData?.ticket_id || '',
    eventType,
    phone,
    messageBody || '',
    tenant.sender_id || '',
    status,
    errorMsg,
    apiResponse || '{}',
    tenant.test_mode ? 1 : 0
  );

  return { status, reason: errorMsg || status };
}

module.exports = { processSms };
