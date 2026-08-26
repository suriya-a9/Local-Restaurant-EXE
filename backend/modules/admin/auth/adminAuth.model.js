const pool = require("../../../config/db");

const createAdmin = async (name, email, password) => {
    const query = `
        INSERT INTO super_admins (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at;
    `;

    const values = [name, email, password];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findAdminByEmail = async (email) => {
    const query = `
        SELECT id, name, email, password
        FROM super_admins
        WHERE email = $1;
    `;

    const result = await pool.query(query, [email]);

    return result.rows[0];
};

const findAdminById = async (id) => {
    const query = `
        SELECT id, name, email, created_at
        FROM super_admins
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createAdmin,
    findAdminByEmail,
    findAdminById,
};