const pool = require("../../../config/db");

const createCustomer = async ({ clientId, locationId, name, mobileNumber, address }) => {
    const result = await pool.query(
        `INSERT INTO customers
            (client_id, business_location_id, name, mobile_number, address)
         SELECT $1, bl.id, $3, $4, $5
         FROM business_locations bl
         WHERE bl.id = $2 AND bl.client_id = $1
         RETURNING *`,
        [clientId, locationId, name, mobileNumber, address || null]
    );

    return result.rows[0];
};

const getCustomers = async (clientId, locationId, search) => {
    const result = await pool.query(
        `SELECT
            c.*,
            bl.name AS business_location_name
         FROM customers c
         JOIN business_locations bl ON bl.id = c.business_location_id
         WHERE c.client_id = $1
           AND ($2::uuid IS NULL OR c.business_location_id = $2)
           AND ($3::text IS NULL OR c.name ILIKE '%' || $3 || '%' OR c.mobile_number ILIKE '%' || $3 || '%')
         ORDER BY c.created_at DESC`,
        [clientId, locationId || null, search?.trim() || null]
    );

    return result.rows;
};

module.exports = { createCustomer, getCustomers };