const cron = require('node-cron');
const { getDb } = require('../db/connection');
const { decrypt } = require('../utils/crypto');
const kwtsms = require('./kwtsms');
const logger = require('../utils/logger');
const { LOG_SOURCES, LOG_RETENTION_DAYS } = require('../utils/constants');

async function syncTenant(tenant) {
  try {
    const username = decrypt(tenant.kwtsms_user);
    const password = decrypt(tenant.kwtsms_pass);
    const db = getDb();

    // Sync balance
    const balanceResult = await kwtsms.checkBalance(username, password);
    if (balanceResult.result === 'OK') {
      db.prepare('UPDATE tenants SET balance = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(balanceResult.available, tenant.id);
    }

    // Sync SenderIDs
    const senderIds = await kwtsms.getSenderIds(username, password);
    db.prepare('DELETE FROM sender_ids WHERE tenant_id = ?').run(tenant.id);
    for (const sid of senderIds) {
      const name = typeof sid === 'string' ? sid : sid.name || '';
      if (name) {
        db.prepare(
          'INSERT INTO sender_ids (tenant_id, name, status, synced_at) VALUES (?, ?, ?, datetime(\'now\'))'
        ).run(tenant.id, name, 'active');
      }
    }

    // Sync coverage
    const coverage = await kwtsms.getCoverage(username, password);
    db.prepare('DELETE FROM coverage WHERE tenant_id = ?').run(tenant.id);
    for (const c of coverage) {
      db.prepare(
        'INSERT INTO coverage (tenant_id, country_code, country_name, prefix, rate, synced_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))'
      ).run(
        tenant.id,
        c.country_code || c.code || '',
        c.country_name || c.country || '',
        c.prefix || c.mobile_prefix || '',
        parseFloat(c.rate || c.price || 0)
      );
    }

    logger.log(tenant.id, LOG_SOURCES.SYNC, 'Daily sync completed', {
      balance: balanceResult.available,
      senderIds: senderIds.length,
      coverage: coverage.length,
    });
  } catch (err) {
    logger.error(tenant.id, LOG_SOURCES.SYNC, 'Sync failed', { error: err.message });
  }
}

function purgeLogs() {
  try {
    const db = getDb();
    const cutoff = `-${LOG_RETENTION_DAYS} days`;
    db.prepare(`DELETE FROM sms_logs WHERE created_at < datetime('now', ?)`).run(cutoff);
    db.prepare(`DELETE FROM debug_logs WHERE created_at < datetime('now', ?)`).run(cutoff);
  } catch (err) {
    console.error('Log purge failed:', err.message);
  }
}

async function syncAll() {
  try {
    const db = getDb();
    const tenants = db.prepare(
      'SELECT * FROM tenants WHERE kwtsms_user != \'\' AND kwtsms_pass != \'\''
    ).all();

    for (const tenant of tenants) {
      await syncTenant(tenant);
    }

    purgeLogs();
  } catch (err) {
    console.error('syncAll failed:', err.message);
  }
}

function startCron() {
  // Daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running daily sync...');
    await syncAll();
    console.log('Daily sync complete');
  });
}

module.exports = { startCron, syncAll, syncTenant, purgeLogs };
