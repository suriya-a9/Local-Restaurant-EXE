const pool = require("../../../config/db");

const createTable = async (clientId, data) => {
    const query = `
        INSERT INTO restaurant_tables (client_id, business_location_id, name, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        clientId,
        data.business_location_id,
        data.name,
        data.capacity || null,
        data.status || "available",
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const getAllTables = async (clientId, businessLocationId) => {
    const query = `
        SELECT rt.*, bl.name AS business_location_name
        FROM restaurant_tables rt
        JOIN business_locations bl ON bl.id = rt.business_location_id
        WHERE rt.client_id = $1
          AND ($2::uuid IS NULL OR rt.business_location_id = $2)
        ORDER BY rt.name ASC;
    `;

    const result = await pool.query(query, [clientId, businessLocationId || null]);

    return result.rows;
};

const findTableById = async (id, clientId) => {
    const query = `
        SELECT rt.*, bl.name AS business_location_name
        FROM restaurant_tables rt
        JOIN business_locations bl ON bl.id = rt.business_location_id
        WHERE rt.id = $1 AND rt.client_id = $2;
    `;

    const result = await pool.query(query, [id, clientId]);

    return result.rows[0];
};

const updateTable = async (id, clientId, data) => {
    const query = `
        UPDATE restaurant_tables
        SET name = $1,
            capacity = $2,
            business_location_id = $3,
            updated_at = NOW()
        WHERE id = $4 AND client_id = $5
        RETURNING *;
    `;

    const values = [
        data.name,
        data.capacity || null,
        data.business_location_id,
        id,
        clientId,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const updateTableStatus = async (id, clientId, status) => {
    const query = `
        UPDATE restaurant_tables
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND client_id = $3
        RETURNING *;
    `;

    const result = await pool.query(query, [status, id, clientId]);

    return result.rows[0];
};

const deleteTable = async (id, clientId) => {
    const query = `
        DELETE FROM restaurant_tables
        WHERE id = $1 AND client_id = $2
        RETURNING id, name;
    `;

    const result = await pool.query(query, [id, clientId]);

    return result.rows[0];
};

module.exports = {
    createTable,
    getAllTables,
    findTableById,
    updateTable,
    updateTableStatus,
    deleteTable,
};