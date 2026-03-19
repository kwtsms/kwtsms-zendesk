const EVENT_TYPES = {
  TICKET_CREATED: 'ticket.created',
  TICKET_STATUS_OPEN: 'ticket.status.open',
  TICKET_STATUS_PENDING: 'ticket.status.pending',
  TICKET_STATUS_SOLVED: 'ticket.status.solved',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_COMMENT_PUBLIC: 'ticket.comment.public',
};

const EVENT_LIST = Object.values(EVENT_TYPES);

const DEFAULT_RECIPIENTS = {
  [EVENT_TYPES.TICKET_CREATED]: 'customer',
  [EVENT_TYPES.TICKET_STATUS_OPEN]: 'customer',
  [EVENT_TYPES.TICKET_STATUS_PENDING]: 'customer',
  [EVENT_TYPES.TICKET_STATUS_SOLVED]: 'customer',
  [EVENT_TYPES.TICKET_ASSIGNED]: 'admin',
  [EVENT_TYPES.TICKET_COMMENT_PUBLIC]: 'customer',
};

const EVENT_LABELS = {
  [EVENT_TYPES.TICKET_CREATED]: 'New Ticket Created',
  [EVENT_TYPES.TICKET_STATUS_OPEN]: 'Ticket Opened',
  [EVENT_TYPES.TICKET_STATUS_PENDING]: 'Ticket Pending',
  [EVENT_TYPES.TICKET_STATUS_SOLVED]: 'Ticket Solved',
  [EVENT_TYPES.TICKET_ASSIGNED]: 'Ticket Assigned',
  [EVENT_TYPES.TICKET_COMMENT_PUBLIC]: 'Agent Replied',
};

const SMS_STATUS = {
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
};

const LOG_SOURCES = {
  WEBHOOK: 'webhook',
  SEND: 'send',
  SYNC: 'sync',
  AUTH: 'auth',
  TRIGGER: 'trigger',
  SYSTEM: 'system',
};

const KWTSMS_BASE_URL = 'https://www.kwtsms.com/API';

const LOG_RETENTION_DAYS = 90;

module.exports = {
  EVENT_TYPES,
  EVENT_LIST,
  DEFAULT_RECIPIENTS,
  EVENT_LABELS,
  SMS_STATUS,
  LOG_LEVELS,
  LOG_SOURCES,
  KWTSMS_BASE_URL,
  LOG_RETENTION_DAYS,
};
