const { randomUUID } = require('crypto');
const { getDatabase } = require('../database/sqlite');

function getAllTables(clientId, businessLocationId = null) {
  const db = getDatabase();
  let sql = `SELECT rt.*, bl.name AS business_location_name
             FROM restaurant_tables rt
             JOIN business_locations bl ON bl.id = rt.business_location_id
             WHERE rt.client_id = ?`;
  const args = [clientId];
  if (businessLocationId) {
    sql += ' AND rt.business_location_id = ?';
    args.push(businessLocationId);
  }
  sql += ' ORDER BY rt.name ASC';
  return db.prepare(sql).all(...args);
}

function createTable(data) {
  const id = data.id || randomUUID();
  getDatabase().prepare(`
    INSERT INTO restaurant_tables
      (id, client_id, business_location_id, name, capacity, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, data.client_id, data.business_location_id, data.name, data.capacity ?? null, data.status || 'available');
  return { success: true, id };
}

function updateTable(data) {
  const result = getDatabase().prepare(`
    UPDATE restaurant_tables
    SET business_location_id = ?, name = ?, capacity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND client_id = ?
  `).run(data.business_location_id, data.name, data.capacity ?? null, data.id, data.client_id);
  if (!result.changes) throw new Error('Table not found');
  return { success: true };
}

function updateTableStatus(id, clientId, status) {
  const allowed = new Set(['available', 'occupied', 'reserved', 'kot_sent', 'bill_requested']);
  if (!allowed.has(status)) throw new Error('Invalid table status');
  const result = getDatabase().prepare(`
    UPDATE restaurant_tables SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND client_id = ?
  `).run(status, id, clientId);
  if (!result.changes) throw new Error('Table not found');
  return { success: true };
}

function deleteTable(id, clientId) {
  const result = getDatabase().prepare('DELETE FROM restaurant_tables WHERE id = ? AND client_id = ?').run(id, clientId);
  if (!result.changes) throw new Error('Table not found');
  return { success: true };
}

module.exports = { getAllTables, createTable, updateTable, updateTableStatus, deleteTable };
