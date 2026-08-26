const pool = require("../../../config/db");

const createBusinessLocation = async (locationData) => {
    const {
        client_id,
        name,
        code,
        gst_number,
        address,
        city,
        state,
        country,
        postal_code,
        phone,
        email,
        is_primary,
    } = locationData;

    const query = `
        INSERT INTO business_locations
            (client_id, name, code, gst_number, address, city, state, country, postal_code, phone, email, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;

    const values = [
        client_id,
        name,
        code,
        gst_number || null,
        address,
        city,
        state,
        country,
        postal_code || null,
        phone || null,
        email || null,
        is_primary || false,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findLocationByCode = async (client_id, code) => {
    const query = `
        SELECT id FROM business_locations
        WHERE client_id = $1 AND code = $2;
    `;

    const result = await pool.query(query, [client_id, code]);

    return result.rows[0];
};

const getLocationsByClient = async (client_id) => {
    const query = `
        SELECT *
        FROM business_locations
        WHERE client_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [client_id]);

    return result.rows;
};

const unsetPrimaryForClient = async (client_id) => {
    const query = `
        UPDATE business_locations
        SET is_primary = false, updated_at = NOW()
        WHERE client_id = $1 AND is_primary = true;
    `;

    await pool.query(query, [client_id]);
};

const findLocationById = async (id, client_id) => {
    const query = `
        SELECT *
        FROM business_locations
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [id, client_id]);

    return result.rows[0];
};

const findLocationByCodeExcludingId = async (client_id, code, excludeId) => {
    const query = `
        SELECT id FROM business_locations
        WHERE client_id = $1 AND code = $2 AND id != $3;
    `;

    const result = await pool.query(query, [client_id, code, excludeId]);

    return result.rows[0];
};

const updateBusinessLocation = async (id, locationData) => {
    const {
        name,
        code,
        gst_number,
        address,
        city,
        state,
        country,
        postal_code,
        phone,
        email,
        is_primary,
    } = locationData;

    const query = `
        UPDATE business_locations
        SET name = $1,
            code = $2,
            gst_number = $3,
            address = $4,
            city = $5,
            state = $6,
            country = $7,
            postal_code = $8,
            phone = $9,
            email = $10,
            is_primary = $11,
            updated_at = NOW()
        WHERE id = $12
        RETURNING *;
    `;

    const values = [
        name,
        code,
        gst_number || null,
        address,
        city,
        state,
        country,
        postal_code || null,
        phone || null,
        email || null,
        is_primary || false,
        id,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deleteBusinessLocation = async (id) => {
    const query = `
        DELETE FROM business_locations
        WHERE id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createBusinessLocation,
    findLocationByCode,
    findLocationByCodeExcludingId,
    findLocationById,
    getLocationsByClient,
    unsetPrimaryForClient,
    updateBusinessLocation,
    deleteBusinessLocation,
};