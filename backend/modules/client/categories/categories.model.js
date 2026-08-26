const pool = require("../../../config/db");

const createCategory = async (categoryData) => {
    const { client_id, name, description } = categoryData;

    const query = `
        INSERT INTO categories (client_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const values = [client_id, name, description || null];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const findCategoryByName = async (client_id, name) => {
    const query = `
        SELECT id FROM categories
        WHERE client_id = $1 AND name = $2;
    `;

    const result = await pool.query(query, [client_id, name]);

    return result.rows[0];
};

const findCategoryByNameExcludingId = async (client_id, name, excludeId) => {
    const query = `
        SELECT id FROM categories
        WHERE client_id = $1 AND name = $2 AND id != $3;
    `;

    const result = await pool.query(query, [client_id, name, excludeId]);

    return result.rows[0];
};

const findCategoryById = async (id, client_id) => {
    const query = `
        SELECT *
        FROM categories
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [id, client_id]);

    return result.rows[0];
};

const getCategoriesByClient = async (client_id) => {
    const query = `
        SELECT *
        FROM categories
        WHERE client_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [client_id]);

    return result.rows;
};

const updateCategory = async (id, categoryData) => {
    const { name, description } = categoryData;

    const query = `
        UPDATE categories
        SET name = $1,
            description = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
    `;

    const values = [name, description || null, id];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deleteCategory = async (id) => {
    const query = `
        DELETE FROM categories
        WHERE id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createCategory,
    findCategoryByName,
    findCategoryByNameExcludingId,
    findCategoryById,
    getCategoriesByClient,
    updateCategory,
    deleteCategory,
};