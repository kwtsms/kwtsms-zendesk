const { getDb } = require('./connection');
const { EVENT_LIST, DEFAULT_RECIPIENTS } = require('../utils/constants');

const DEFAULT_TEMPLATES = {
  'ticket.created': {
    en: {
      subject: 'New Ticket Created',
      body: 'Hi {{requester.name}}, your support ticket #{{ticket.id}} "{{ticket.subject}}" has been received. We will respond shortly.',
    },
    ar: {
      subject: 'تذكرة جديدة',
      body: 'مرحبا {{requester.name}}، تم استلام تذكرة الدعم #{{ticket.id}} "{{ticket.subject}}". سنقوم بالرد قريبا.',
    },
  },
  'ticket.status.open': {
    en: {
      subject: 'Ticket Opened',
      body: 'Hi {{requester.name}}, your ticket #{{ticket.id}} is now open and being reviewed by our team.',
    },
    ar: {
      subject: 'تم فتح التذكرة',
      body: 'مرحبا {{requester.name}}، تذكرتك #{{ticket.id}} مفتوحة الآن وقيد المراجعة من قبل فريقنا.',
    },
  },
  'ticket.status.pending': {
    en: {
      subject: 'Ticket Pending',
      body: 'Hi {{requester.name}}, your ticket #{{ticket.id}} is pending your response. Please reply to continue.',
    },
    ar: {
      subject: 'التذكرة بانتظار الرد',
      body: 'مرحبا {{requester.name}}، تذكرتك #{{ticket.id}} بانتظار ردك. يرجى الرد للمتابعة.',
    },
  },
  'ticket.status.solved': {
    en: {
      subject: 'Ticket Solved',
      body: 'Hi {{requester.name}}, your ticket #{{ticket.id}} has been resolved. If you need further help, simply reply to reopen it.',
    },
    ar: {
      subject: 'تم حل التذكرة',
      body: 'مرحبا {{requester.name}}، تم حل تذكرتك #{{ticket.id}}. إذا كنت بحاجة إلى مزيد من المساعدة، قم بالرد لإعادة فتحها.',
    },
  },
  'ticket.assigned': {
    en: {
      subject: 'Ticket Assigned',
      body: 'Ticket #{{ticket.id}} "{{ticket.subject}}" has been assigned to you. Requester: {{requester.name}}.',
    },
    ar: {
      subject: 'تم تعيين التذكرة',
      body: 'تم تعيين التذكرة #{{ticket.id}} "{{ticket.subject}}" لك. مقدم الطلب: {{requester.name}}.',
    },
  },
  'ticket.comment.public': {
    en: {
      subject: 'Agent Replied',
      body: 'Hi {{requester.name}}, {{agent.name}} has replied to your ticket #{{ticket.id}}. Please check your support portal for details.',
    },
    ar: {
      subject: 'رد الوكيل',
      body: 'مرحبا {{requester.name}}، قام {{agent.name}} بالرد على تذكرتك #{{ticket.id}}. يرجى مراجعة بوابة الدعم للتفاصيل.',
    },
  },
};

function seedTenant(tenantId) {
  const db = getDb();

  const seedAll = db.transaction(() => {
    for (const eventType of EVENT_LIST) {
      const templates = DEFAULT_TEMPLATES[eventType];
      if (templates) {
        for (const locale of ['en', 'ar']) {
          const t = templates[locale];
          db.prepare(`
            INSERT OR IGNORE INTO templates (tenant_id, event_type, locale, subject, body, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
          `).run(tenantId, eventType, locale, t.subject, t.body);
        }
      }
      db.prepare(`
        INSERT OR IGNORE INTO event_toggles (tenant_id, event_type, is_enabled, recipient_type)
        VALUES (?, ?, 0, ?)
      `).run(tenantId, eventType, DEFAULT_RECIPIENTS[eventType] || 'customer');
    }
  });

  seedAll();
}

module.exports = { seedTenant, DEFAULT_TEMPLATES };
