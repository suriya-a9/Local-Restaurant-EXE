const pool = require("../../../config/db");

const createUnit = async (data) => {
    const { client_id, name, short_name, allow_decimal } = data;

    const query = `
        INSERT INTO units (client_id, name, short_name, allow_decimal)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [client_id, name, short_name, !!allow_decimal];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findUnitConflict = async (client_id, name, short_name) => {
    const query = `
        SELECT id, name, short_name FROM units
        WHERE client_id = $1 AND (name = $2 OR short_name = $3);
    `;

    const result = await pool.query(query, [client_id, name, short_name]);

    return result.rows[0];
};

const findUnitConflictExcludingId = async (client_id, name, short_name, excludeId) => {
    const query = `
        SELECT id, name, short_name FROM units
        WHERE client_id = $1 AND (name = $2 OR short_name = $3) AND id != $4;
    `;

    const result = await pool.query(query, [client_id, name, short_name, excludeId]);

    return result.rows[0];
};

const findUnitById = async (id, client_id) => {
    const query = `
        SELECT *
        FROM units
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [id, client_id]);

    return result.rows[0];
};

const getUnitsByClient = async (client_id) => {
    const query = `
        SELECT *
        FROM units
        WHERE client_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [client_id]);

    return result.rows;
};

const updateUnit = async (id, data) => {
    const { name, short_name, allow_decimal } = data;

    const query = `
        UPDATE units
        SET name = $1,
            short_name = $2,
            allow_decimal = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING *;
    `;

    const values = [name, short_name, !!allow_decimal, id];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deleteUnit = async (id) => {
    const query = `
        DELETE FROM units
        WHERE id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createUnit,
    findUnitConflict,
    findUnitConflictExcludingId,
    findUnitById,
    getUnitsByClient,
    updateUnit,
    deleteUnit,
};