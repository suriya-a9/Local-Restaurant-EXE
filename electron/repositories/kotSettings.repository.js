const { randomUUID } = require('crypto');
const { getDatabase } = require('../database/sqlite');

function getByLocation(clientId, locationId) {
  const db = getDatabase();
  const settings = db.prepare('SELECT * FROM kot_printer_settings WHERE client_id = ? AND business_location_id = ?').get(clientId, locationId);
  if (!settings) return { settings: null, stations: [] };
  const stations = db.prepare('SELECT * FROM kot_printer_stations WHERE kot_printer_settings_id = ? ORDER BY created_at ASC').all(settings.id);
  return {
    settings: { ...settings, has_extra_kot: settings.has_extra_kot ? 'yes' : 'no' },
    stations,
  };
}

function saveConfiguration(data) {
  const db = getDatabase();
  const tx = db.transaction(() => {
    let settings = db.prepare('SELECT * FROM kot_printer_settings WHERE client_id = ? AND business_location_id = ?').get(data.client_id, data.business_location_id);
    const hasExtra = data.has_extra_kot === true || data.has_extra_kot === 1 || data.has_extra_kot === 'yes';
    if (settings) {
      db.prepare(`UPDATE kot_printer_settings SET system_ip=?, billing_printer_ip=?, billing_printer_port=?, default_kot_ip=?, default_kot_port=?, has_extra_kot=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND client_id=?`)
        .run(data.system_ip || null, data.billing_printer_ip || null, Number(data.billing_printer_port) || 9100, data.default_kot_ip || null, Number(data.default_kot_port) || 9100, hasExtra ? 1 : 0, settings.id, data.client_id);
    } else {
      const id = data.id || randomUUID();
      db.prepare(`INSERT INTO kot_printer_settings
        (id,client_id,business_location_id,system_ip,billing_printer_ip,billing_printer_port,default_kot_ip,default_kot_port,has_extra_kot,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
        .run(id, data.client_id, data.business_location_id, data.system_ip || null, data.billing_printer_ip || null, Number(data.billing_printer_port) || 9100, data.default_kot_ip || null, Number(data.default_kot_port) || 9100, hasExtra ? 1 : 0);
      settings = { id };
    }

    db.prepare('DELETE FROM kot_printer_stations WHERE kot_printer_settings_id = ?').run(settings.id);
    if (hasExtra) {
      const insert = db.prepare(`INSERT INTO kot_printer_stations
        (id,kot_printer_settings_id,category_id,printer_ip,printer_port,created_at,updated_at)
        VALUES(?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
      for (const station of data.stations || []) {
        insert.run(station.id || randomUUID(), settings.id, station.category_id || null, station.printer_ip, Number(station.printer_port) || 9100);
      }
    }
    return settings.id;
  });
  const id = tx();
  const saved = getByLocation(data.client_id, data.business_location_id);
  saved.settings.id = id;
  return saved;
}

function deleteStation(id, clientId) {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM kot_printer_stations WHERE id=? AND kot_printer_settings_id IN
    (SELECT id FROM kot_printer_settings WHERE client_id=?)`).run(id, clientId);
  if (!result.changes) throw new Error('KOT station not found');
  return { success: true };
}

module.exports = { getByLocation, saveConfiguration, deleteStation };
