const axios = require('axios');
const { EVENT_TYPES, EVENT_LABELS } = require('../utils/constants');

function zenApi(subdomain, oauthToken) {
  return axios.create({
    baseURL: `https://${subdomain}.zendesk.com/api/v2`,
    headers: { Authorization: `Bearer ${oauthToken}` },
    timeout: 15000,
  });
}

function buildTriggerConditions(eventType) {
  switch (eventType) {
    case EVENT_TYPES.TICKET_CREATED:
      return { all: [{ field: 'status', operator: 'is', value: 'new' }], any: [] };
    case EVENT_TYPES.TICKET_STATUS_OPEN:
      return {
        all: [{ field: 'status', operator: 'is', value: 'open' }],
        any: [{ field: 'update_type', operator: 'is', value: 'Change' }],
      };
    case EVENT_TYPES.TICKET_STATUS_PENDING:
      return {
        all: [{ field: 'status', operator: 'is', value: 'pending' }],
        any: [{ field: 'update_type', operator: 'is', value: 'Change' }],
      };
    case EVENT_TYPES.TICKET_STATUS_SOLVED:
      return {
        all: [{ field: 'status', operator: 'is', value: 'solved' }],
        any: [{ field: 'update_type', operator: 'is', value: 'Change' }],
      };
    case EVENT_TYPES.TICKET_ASSIGNED:
      return {
        all: [{ field: 'assignee_id', operator: 'changed', value: '' }],
        any: [{ field: 'update_type', operator: 'is', value: 'Change' }],
      };
    case EVENT_TYPES.TICKET_COMMENT_PUBLIC:
      return {
        all: [
          { field: 'comment_is_public', operator: 'is', value: 'true' },
          { field: 'role', operator: 'is', value: 'agent' },
        ],
        any: [],
      };
    default:
      return { all: [], any: [] };
  }
}

async function createTrigger(subdomain, oauthToken, eventType, webhookId) {
  const api = zenApi(subdomain, oauthToken);
  const conditions = buildTriggerConditions(eventType);
  const label = EVENT_LABELS[eventType] || eventType;

  const triggerPayload = {
    trigger: {
      title: `[kwtsms] SMS: ${label}`,
      active: true,
      conditions,
      actions: [
        {
          field: 'notification_webhook',
          value: [
            webhookId,
            JSON.stringify({
              event_type: eventType,
              ticket_id: '{{ticket.id}}',
              ticket_subject: '{{ticket.title}}',
              ticket_status: '{{ticket.status}}',
              requester_name: '{{ticket.requester.name}}',
              requester_email: '{{ticket.requester.email}}',
              requester_phone: '{{ticket.requester.phone}}',
              assignee_name: '{{ticket.assignee.name}}',
              current_user_name: '{{current_user.name}}',
            }),
          ],
        },
      ],
    },
  };

  const response = await api.post('/triggers.json', triggerPayload);
  return response.data.trigger;
}

async function deleteTrigger(subdomain, oauthToken, triggerId) {
  const api = zenApi(subdomain, oauthToken);
  await api.delete(`/triggers/${triggerId}.json`);
}

async function ensureWebhook(subdomain, oauthToken, webhookBaseUrl) {
  const api = zenApi(subdomain, oauthToken);

  // Check if webhook already exists
  const existing = await api.get('/webhooks');
  const kwtsmsWebhook = existing.data.webhooks?.find(
    (w) => w.name === 'kwtsms SMS Gateway'
  );

  if (kwtsmsWebhook) return kwtsmsWebhook.id;

  // Create webhook
  const response = await api.post('/webhooks', {
    webhook: {
      name: 'kwtsms SMS Gateway',
      endpoint: `${webhookBaseUrl}/webhook/${subdomain}/ticket-event`,
      http_method: 'POST',
      request_format: 'json',
      status: 'active',
      signing_secret: {
        algorithm: 'SHA256',
        secret: process.env.WEBHOOK_SIGNING_SECRET,
      },
    },
  });

  return response.data.webhook.id;
}

module.exports = { createTrigger, deleteTrigger, ensureWebhook, buildTriggerConditions };
