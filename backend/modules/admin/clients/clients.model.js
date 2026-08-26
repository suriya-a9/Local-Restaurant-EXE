const pool = require("../../../config/db");

const createClient = async (clientData) => {
    const { business_name, name, email, password, phone } = clientData;

    const query = `
        INSERT INTO clients (business_name, name, email, password, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, business_name, name, email, phone, status, created_at;
    `;

    const values = [business_name, name, email, password, phone];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findClientByName = async (name) => {
    const query = `
        SELECT id, business_name, name, email, password, phone, status
        FROM clients
        WHERE LOWER(name) = LOWER($1);
    `;

    const result = await pool.query(query, [name]);

    return result.rows[0];
};

const findClientById = async (id) => {
    const query = `
        SELECT id, business_name, name, email, phone, status, created_at, updated_at
        FROM clients
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

const getAllClients = async () => {
    const query = `
        SELECT id, business_name, name, email, phone, status, created_at, updated_at
        FROM clients
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
};

const updateClientStatus = async (id, status) => {
    const query = `
        UPDATE clients
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, business_name, name, email, phone, status, updated_at;
    `;

    const values = [status, id];

    const result = await pool.query(query, values);

    return result.rows[0];
};

module.exports = {
    createClient,
    findClientByName,
    findClientById,
    getAllClients,
    updateClientStatus,
};