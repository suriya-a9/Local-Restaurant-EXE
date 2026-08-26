// taxRates.model.js
const pool = require("../../../config/db");

const createTaxRate = async (clientId, data) => {
    const query = `
        INSERT INTO tax_rates (client_id, name, rate_percent, tax_type, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        clientId,
        data.name,
        data.rate_percent,
        data.tax_type || "gst",
        data.is_active ?? true,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const getAllTaxRates = async (clientId) => {
    const query = `
        SELECT * FROM tax_rates
        WHERE client_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [clientId]);

    return result.rows;
};

module.exports = {
    createTaxRate,
    getAllTaxRates,
};