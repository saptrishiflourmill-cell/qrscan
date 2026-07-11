const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'database', 'visitors.db');
let db = null;

async function initDb() {
  const dbDir = path.join(DATA_DIR, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.run(schema);
  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

module.exports = { initDb, saveDb, getDb };
