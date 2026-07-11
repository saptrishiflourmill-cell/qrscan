const { getDb, saveDb } = require('../database/db');

function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function execute(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  saveDb();
}

class Visitor {
  static getAll({ search, date, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(fullName LIKE ? OR phone LIKE ? OR visitorId LIKE ? OR company LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (date) {
      whereClauses.push('entryDate = ?');
      params.push(date);
    }

    const where = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const countRow = queryOne(`SELECT COUNT(*) as total FROM visitors ${where}`, params);
    const total = countRow ? countRow.total : 0;
    const totalPages = Math.ceil(total / limit);

    const visitors = queryAll(
      `SELECT * FROM visitors ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { visitors, total, page, totalPages, limit };
  }

  static getById(id) {
    return queryOne('SELECT * FROM visitors WHERE id = ?', [id]);
  }

  static getByVisitorId(visitorId) {
    return queryOne('SELECT * FROM visitors WHERE visitorId = ?', [visitorId]);
  }

  static getNextVisitorId() {
    const row = queryOne('SELECT COUNT(*) as count FROM visitors');
    const num = (row ? row.count : 0) + 1;
    return 'VIS-' + String(num).padStart(6, '0');
  }

  static create(data) {
    const visitorId = data.visitorId || this.getNextVisitorId();
    execute(
      `INSERT INTO visitors (visitorId, fullName, phone, email, address, company, personToMeet, purpose, entryDate, entryTime, exitTime, vehicleNumber, photo, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', datetime('now'), datetime('now'))`,
      [
        visitorId,
        data.fullName,
        data.phone,
        data.email || '',
        data.address,
        data.company,
        data.personToMeet,
        data.purpose,
        data.entryDate,
        data.entryTime,
        data.exitTime || '',
        data.vehicleNumber || '',
        data.photo || ''
      ]
    );
    return this.getByVisitorId(visitorId);
  }

  static update(id, data) {
    const existing = this.getById(id);
    if (!existing) return null;

    execute(
      `UPDATE visitors SET fullName = ?, phone = ?, email = ?, address = ?, company = ?, personToMeet = ?, purpose = ?, entryDate = ?, entryTime = ?, exitTime = ?, vehicleNumber = ?, photo = ?, updatedAt = datetime('now')
       WHERE id = ?`,
      [
        data.fullName || existing.fullName,
        data.phone || existing.phone,
        data.email !== undefined ? data.email : existing.email,
        data.address || existing.address,
        data.company || existing.company,
        data.personToMeet || existing.personToMeet,
        data.purpose || existing.purpose,
        data.entryDate || existing.entryDate,
        data.entryTime || existing.entryTime,
        data.exitTime !== undefined ? data.exitTime : existing.exitTime,
        data.vehicleNumber !== undefined ? data.vehicleNumber : existing.vehicleNumber,
        data.photo !== undefined ? data.photo : existing.photo,
        id
      ]
    );
    return this.getById(id);
  }

  static delete(id) {
    const existing = this.getById(id);
    if (!existing) return false;
    execute('DELETE FROM visitors WHERE id = ?', [id]);
    return true;
  }

  static checkIn(id) {
    const existing = this.getById(id);
    if (!existing) return null;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    execute(
      "UPDATE visitors SET status = 'Active', entryDate = ?, entryTime = ?, updatedAt = datetime('now') WHERE id = ?",
      [date, time, id]
    );
    return this.getById(id);
  }

  static checkOut(id) {
    const existing = this.getById(id);
    if (!existing) return null;
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    execute(
      "UPDATE visitors SET status = 'Checked Out', exitTime = ?, updatedAt = datetime('now') WHERE id = ?",
      [time, id]
    );
    return this.getById(id);
  }

  static getStats() {
    const total = queryOne('SELECT COUNT(*) as count FROM visitors');
    const active = queryOne("SELECT COUNT(*) as count FROM visitors WHERE status = 'Active'");
    const checkedOut = queryOne("SELECT COUNT(*) as count FROM visitors WHERE status = 'Checked Out'");
    const today = queryOne("SELECT COUNT(*) as count FROM visitors WHERE entryDate = date('now')");
    return {
      total: total ? total.count : 0,
      active: active ? active.count : 0,
      checkedOut: checkedOut ? checkedOut.count : 0,
      today: today ? today.count : 0
    };
  }
}

module.exports = Visitor;
