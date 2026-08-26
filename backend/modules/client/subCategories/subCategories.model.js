const pool = require("../../../config/db");

const createSubCategory = async (data) => {
    const { client_id, category_id, name } = data;

    const query = `
        INSERT INTO sub_categories (client_id, category_id, name)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const result = await pool.query(query, [client_id, category_id, name]);

    return result.rows[0];
};

const findCategoryForClient = async (category_id, client_id) => {
    const query = `
        SELECT id, name FROM categories
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [category_id, client_id]);

    return result.rows[0];
};

const findSubCategoryByName = async (category_id, name) => {
    const query = `
        SELECT id FROM sub_categories
        WHERE category_id = $1 AND name = $2;
    `;

    const result = await pool.query(query, [category_id, name]);

    return result.rows[0];
};

const findSubCategoryByNameExcludingId = async (category_id, name, excludeId) => {
    const query = `
        SELECT id FROM sub_categories
        WHERE category_id = $1 AND name = $2 AND id != $3;
    `;

    const result = await pool.query(query, [category_id, name, excludeId]);

    return result.rows[0];
};

const findSubCategoryById = async (id, client_id) => {
    const query = `
        SELECT *
        FROM sub_categories
        WHERE id = $1 AND client_id = $2;
    `;

    const result = await pool.query(query, [id, client_id]);

    return result.rows[0];
};

const getSubCategoriesByClient = async (client_id) => {
    const query = `
        SELECT
            sc.*,
            json_build_object('id', c.id, 'name', c.name) AS category
        FROM sub_categories sc
        JOIN categories c ON c.id = sc.category_id
        WHERE sc.client_id = $1
        ORDER BY sc.created_at DESC;
    `;

    const result = await pool.query(query, [client_id]);

    return result.rows;
};

const updateSubCategory = async (id, data) => {
    const { category_id, name } = data;

    const query = `
        UPDATE sub_categories
        SET category_id = $1,
            name = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
    `;

    const result = await pool.query(query, [category_id, name, id]);

    return result.rows[0];
};

const deleteSubCategory = async (id) => {
    const query = `
        DELETE FROM sub_categories
        WHERE id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createSubCategory,
    findCategoryForClient,
    findSubCategoryByName,
    findSubCategoryByNameExcludingId,
    findSubCategoryById,
    getSubCategoriesByClient,
    updateSubCategory,
    deleteSubCategory,
};