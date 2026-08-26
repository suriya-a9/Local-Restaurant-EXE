const { getDatabase } = require("../database/sqlite");

function getAllCategories(clientId) {
    const db = getDatabase();

    return db.prepare(`
    SELECT *
    FROM categories
    WHERE client_id = ?
    ORDER BY name ASC
  `).all(clientId);
}

function createCategory(data) {
    const db = getDatabase();

    const stmt = db.prepare(`
    INSERT INTO categories (
      id,
      client_id,
      name,
      description,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

    stmt.run(
        data.id,
        data.client_id,
        data.name,
        data.description || null
    );

    return {
        success: true,
        id: data.id,
    };
}

function updateCategory(data) {
    const db = getDatabase();

    db.prepare(`
    UPDATE categories
    SET
      name = ?,
      description = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND client_id = ?
  `).run(
        data.name,
        data.description || null,
        data.id,
        data.client_id
    );

    return {
        success: true,
    };
}

function deleteCategory(id, clientId) {
    const db = getDatabase();

    db.prepare(`
    DELETE FROM categories
    WHERE id = ?
      AND client_id = ?
  `).run(id, clientId);

    return {
        success: true,
    };
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};