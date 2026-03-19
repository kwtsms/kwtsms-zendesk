const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db;
let dbPath;
let SQL;

// Wrapper that mimics the better-sqlite3 API so all downstream code works unchanged
class PreparedStatement {
  constructor(database, sql) {
    this._db = database;
    this._sql = sql;
  }

  run(...params) {
    this._db.run(this._sql, params);
    const changes = this._db.getRowsModified();
    const info = this._db.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = info.length > 0 ? info[0].values[0][0] : 0;
    _save();
    return { changes, lastInsertRowid };
  }

  get(...params) {
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      stmt.free();
      const row = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
      return row;
    }
    stmt.free();
    return undefined;
  }

  all(...params) {
    const stmt = this._db.prepare(this._sql);
    stmt.bind(params);
    const rows = [];
    const columns = stmt.getColumnNames();
    while (stmt.step()) {
      const values = stmt.get();
      const row = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
}

class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    return new PreparedStatement(this._db, sql);
  }

  exec(sql) {
    this._db.run(sql);
    _save();
  }

  pragma(setting) {
    try {
      this._db.run(`PRAGMA ${setting}`);
    } catch (e) {
      // Some pragmas may not be supported in sql.js
    }
  }

  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this._db.run('COMMIT');
        _save();
        return result;
      } catch (err) {
        this._db.run('ROLLBACK');
        throw err;
      }
    };
  }

  close() {
    _save();
    this._db.close();
  }
}

function _save() {
  if (!db || !dbPath) return;
  try {
    const data = db._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
}

function getDb() {
  if (db) return db;
  throw new Error('Database not initialized. Call initDb() first.');
}

async function _initSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function initDb() {
  // sql.js init is async, but we need sync getDb() everywhere.
  // Use a sync workaround: initialize synchronously if SQL is already loaded,
  // otherwise use the sync require approach.
  if (db) return;

  dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'kwtsms.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // sql.js can be initialized synchronously by requiring the module directly
  const SqlJs = require('sql.js');

  // SqlJs() returns a promise, but we need sync init.
  // Use a workaround: load the WASM synchronously if possible,
  // or use the pre-built version that doesn't need async WASM loading.
  // sql.js supports sync init when no locateFile is provided and WASM is bundled.
  let sqlDb;

  // Try loading existing database file
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    // We need to handle the async nature of sql.js init
    // Store a promise and resolve it
    _initPromise = SqlJs().then((sqlModule) => {
      SQL = sqlModule;
      sqlDb = new SQL.Database(fileBuffer);
      db = new DatabaseWrapper(sqlDb);
      db.pragma('foreign_keys = ON');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema);
      console.log('Database initialized (loaded from file)');
    });
  } else {
    _initPromise = SqlJs().then((sqlModule) => {
      SQL = sqlModule;
      sqlDb = new SQL.Database();
      db = new DatabaseWrapper(sqlDb);
      db.pragma('foreign_keys = ON');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema);
      _save();
      console.log('Database initialized (new)');
    });
  }

  return _initPromise;
}

let _initPromise = null;

function getInitPromise() {
  return _initPromise;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDb, closeDb, getInitPromise };
