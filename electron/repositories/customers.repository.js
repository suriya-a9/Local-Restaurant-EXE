const { randomUUID } = require('crypto');
const { getDatabase } = require('../database/sqlite');

function getCustomers(clientId, locationId = null, search = '') {
  const db = getDatabase();
  let sql = `SELECT c.*, bl.name AS business_location_name
             FROM customers c
             JOIN business_locations bl ON bl.id = c.business_location_id
             WHERE c.client_id = ?`;
  const args = [clientId];
  if (locationId) {
    sql += ' AND c.business_location_id = ?';
    args.push(locationId);
  }
  const term = String(search || '').trim();
  if (term) {
    sql += ' AND (LOWER(c.name) LIKE LOWER(?) OR LOWER(c.mobile_number) LIKE LOWER(?))';
    args.push(`%${term}%`, `%${term}%`);
  }
  sql += ' ORDER BY c.created_at DESC';
  return db.prepare(sql).all(...args);
}

function createCustomer(data) {
  const id = data.id || randomUUID();
  getDatabase().prepare(`
    INSERT INTO customers
      (id, client_id, business_location_id, name, mobile_number, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, data.client_id, data.business_location_id, data.name, data.mobile_number, data.address || null);
  return getDatabase().prepare(`
    SELECT c.*, bl.name AS business_location_name
    FROM customers c JOIN business_locations bl ON bl.id = c.business_location_id
    WHERE c.id = ?
  `).get(id);
}

module.exports = { getCustomers, createCustomer };
