CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subdomain TEXT UNIQUE NOT NULL,
  company_name TEXT DEFAULT '',
  oauth_token TEXT,
  kwtsms_user TEXT,
  kwtsms_pass TEXT,
  webhook_id TEXT DEFAULT '',
  sender_id TEXT DEFAULT '',
  is_enabled INTEGER DEFAULT 0,
  test_mode INTEGER DEFAULT 1,
  debug_logging INTEGER DEFAULT 0,
  balance REAL DEFAULT 0,
  default_locale TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, event_type, locale)
);

CREATE TABLE IF NOT EXISTS event_toggles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 0,
  recipient_type TEXT DEFAULT 'customer',
  trigger_id TEXT DEFAULT '',
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, event_type)
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  ticket_id TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  recipient_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  sender_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT DEFAULT '',
  api_response TEXT DEFAULT '{}',
  test_mode INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sender_ids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT '',
  synced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coverage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT DEFAULT '',
  prefix TEXT NOT NULL,
  rate REAL DEFAULT 0,
  synced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS debug_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  context TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant ON sms_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_dedup ON sms_logs(tenant_id, recipient_phone, ticket_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_debug_logs_tenant ON debug_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_tenant ON templates(tenant_id, event_type, locale);
CREATE INDEX IF NOT EXISTS idx_event_toggles_tenant ON event_toggles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coverage_tenant ON coverage(tenant_id, prefix);
