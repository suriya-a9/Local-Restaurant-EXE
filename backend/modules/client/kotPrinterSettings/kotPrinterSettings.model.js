const pool = require("../../../config/db");

const findSettingsByLocation = async (clientId, locationId) => {
    const result = await pool.query(
        `SELECT * FROM kot_printer_settings WHERE client_id = $1 AND business_location_id = $2;`,
        [clientId, locationId]
    );

    return result.rows[0] || null;
};

const findSettingsById = async (id, clientId) => {
    const result = await pool.query(
        `SELECT * FROM kot_printer_settings WHERE id = $1 AND client_id = $2;`,
        [id, clientId]
    );

    return result.rows[0] || null;
};

const getStationsBySettingsId = async (settingsId) => {
    const result = await pool.query(
        `SELECT * FROM kot_printer_stations WHERE kot_printer_settings_id = $1 ORDER BY created_at ASC;`,
        [settingsId]
    );

    return result.rows;
};

const createSettings = async (clientId, data) => {
    const query = `
        INSERT INTO kot_printer_settings
            (client_id, business_location_id, system_ip, billing_printer_ip, billing_printer_port,
             default_kot_ip, default_kot_port, has_extra_kot)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

    const values = [
        clientId,
        data.business_location_id,
        data.system_ip,
        data.billing_printer_ip,
        data.billing_printer_port,
        data.default_kot_ip,
        data.default_kot_port,
        data.has_extra_kot,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const updateSettings = async (id, clientId, data) => {
    const query = `
        UPDATE kot_printer_settings
        SET system_ip = $1,
            billing_printer_ip = $2,
            billing_printer_port = $3,
            default_kot_ip = $4,
            default_kot_port = $5,
            has_extra_kot = $6,
            updated_at = NOW()
        WHERE id = $7 AND client_id = $8
        RETURNING *;
    `;

    const values = [
        data.system_ip,
        data.billing_printer_ip,
        data.billing_printer_port,
        data.default_kot_ip,
        data.default_kot_port,
        data.has_extra_kot,
        id,
        clientId,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const createStation = async (settingsId, data) => {
    const query = `
        INSERT INTO kot_printer_stations (kot_printer_settings_id, category_id, printer_ip, printer_port)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [settingsId, data.category_id, data.printer_ip, data.printer_port];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findStationById = async (id, clientId) => {
    const result = await pool.query(
        `SELECT ks.*
         FROM kot_printer_stations ks
         JOIN kot_printer_settings s ON s.id = ks.kot_printer_settings_id
         WHERE ks.id = $1 AND s.client_id = $2;`,
        [id, clientId]
    );

    return result.rows[0] || null;
};

const updateStation = async (id, data) => {
    const query = `
        UPDATE kot_printer_stations
        SET printer_ip = $1,
            printer_port = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
    `;

    const values = [data.printer_ip, data.printer_port, id];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deleteStation = async (id) => {
    const result = await pool.query(
        `DELETE FROM kot_printer_stations WHERE id = $1 RETURNING id;`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    findSettingsByLocation,
    findSettingsById,
    getStationsBySettingsId,
    createSettings,
    updateSettings,
    createStation,
    findStationById,
    updateStation,
    deleteStation,
};