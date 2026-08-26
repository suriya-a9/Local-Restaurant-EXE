const pool = require("../../../config/db");

const createFeature = async (name) => {
    const query = `
        INSERT INTO features (name)
        VALUES ($1)
        RETURNING id, name, created_at;
    `;

    const values = [name];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const getAllFeatures = async () => {
    const query = `
        SELECT id, name, created_at, updated_at
        FROM features
        ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
};

const findFeatureById = async (id) => {
    const query = `
        SELECT id, name, created_at, updated_at
        FROM features
        WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

const updateFeature = async (id, name) => {
    const query = `
        UPDATE features
        SET name = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, created_at, updated_at;
    `;

    const values = [name, id];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deleteFeature = async (id) => {
    const query = `
        DELETE FROM features
        WHERE id = $1
        RETURNING id, name;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createFeature,
    getAllFeatures,
    findFeatureById,
    updateFeature,
    deleteFeature,
};