const { getDb } = require('../db/connection');
const { LOG_LEVELS } = require('./constants');

function writeDebugLog(tenantId, level, source, message, context = {}) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO debug_logs (tenant_id, level, source, message, context)
      VALUES (?, ?, ?, ?, ?)
    `).run(tenantId, level, source, message, JSON.stringify(context));
  } catch (err) {
    console.error('Failed to write debug log:', err.message);
  }
}

function log(tenantId, source, message, context = {}) {
  writeDebugLog(tenantId, LOG_LEVELS.INFO, source, message, context);
}

function warn(tenantId, source, message, context = {}) {
  writeDebugLog(tenantId, LOG_LEVELS.WARN, source, message, context);
}

function error(tenantId, source, message, context = {}) {
  writeDebugLog(tenantId, LOG_LEVELS.ERROR, source, message, context);
}

function debug(tenantId, source, message, context = {}) {
  try {
    const db = getDb();
    const tenant = db.prepare('SELECT debug_logging FROM tenants WHERE id = ?').get(tenantId);
    if (tenant && tenant.debug_logging) {
      writeDebugLog(tenantId, LOG_LEVELS.DEBUG, source, message, context);
    }
  } catch (err) {
    // Silently skip debug log if tenant lookup fails
  }
}

module.exports = { log, warn, error, debug };
