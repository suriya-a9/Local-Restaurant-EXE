const pool = require("../../../config/db");

const generateSku = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PRD-${timestamp}-${random}`;
};

const createProduct = async (clientId, data) => {
    const sku = data.sku && data.sku.trim() ? data.sku.trim() : generateSku();

    const query = `
        INSERT INTO products (
            client_id, name, sku, barcode, shortcut_number, image,
            unit_id, category_id, sub_category_id, applicable_tax_id,
            product_type, selling_price_tax_type, enable_stock, alert_quantity,
            margin_percent,
            default_purchase_price_exc_tax, default_purchase_price_inc_tax,
            default_selling_price_exc_tax, default_selling_price_inc_tax
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15,
            $16, $17,
            $18, $19
        )
        RETURNING *;
    `;

    const values = [
        clientId,
        data.name,
        sku,
        data.barcode || null,
        data.shortcut_number,
        data.image || null,
        data.unit_id || null,
        data.category_id || null,
        data.sub_category_id || null,
        data.applicable_tax_id || null,
        data.product_type || "single",
        data.selling_price_tax_type || "exclusive",
        data.enable_stock,
        data.alert_quantity,
        data.margin_percent,
        data.default_purchase_price_exc_tax || 0,
        data.default_purchase_price_inc_tax || 0,
        data.default_selling_price_exc_tax,
        data.default_selling_price_inc_tax,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const updateProduct = async (id, clientId, data) => {
    const query = `
        UPDATE products
        SET name = $1,
            barcode = $2,
            shortcut_number = $3,
            image = COALESCE($4, image),
            unit_id = $5,
            category_id = $6,
            sub_category_id = $7,
            applicable_tax_id = $8,
            selling_price_tax_type = $9,
            enable_stock = $10,
            alert_quantity = $11,
            margin_percent = $12,
            default_purchase_price_exc_tax = $13,
            default_purchase_price_inc_tax = $14,
            default_selling_price_exc_tax = $15,
            default_selling_price_inc_tax = $16,
            updated_at = NOW()
        WHERE id = $17 AND client_id = $18
        RETURNING *;
    `;

    const values = [
        data.name,
        data.barcode || null,
        data.shortcut_number,
        data.image || null,
        data.unit_id || null,
        data.category_id || null,
        data.sub_category_id || null,
        data.applicable_tax_id || null,
        data.selling_price_tax_type || "exclusive",
        data.enable_stock,
        data.alert_quantity,
        data.margin_percent,
        data.default_purchase_price_exc_tax || 0,
        data.default_purchase_price_inc_tax || 0,
        data.default_selling_price_exc_tax,
        data.default_selling_price_inc_tax,
        id,
        clientId,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const setProductLocations = async (productId, locationIds) => {
    await pool.query(
        `DELETE FROM product_business_locations WHERE product_id = $1;`,
        [productId]
    );

    if (!locationIds || locationIds.length === 0) {
        return;
    }

    const values = [];
    const placeholders = locationIds
        .map((locationId, index) => {
            values.push(productId, locationId);
            return `($${index * 2 + 1}, $${index * 2 + 2})`;
        })
        .join(", ");

    await pool.query(
        `INSERT INTO product_business_locations (product_id, business_location_id) VALUES ${placeholders};`,
        values
    );
};

const PRODUCT_SELECT = `
    SELECT
        p.*,
        json_build_object('id', u.id, 'name', u.name) AS unit,
        json_build_object('id', c.id, 'name', c.name) AS category,
        json_build_object('id', sc.id, 'name', sc.name) AS sub_category,
        COALESCE(
            (SELECT json_agg(json_build_object('id', bl.id, 'name', bl.name))
             FROM product_business_locations pbl
             JOIN business_locations bl ON bl.id = pbl.business_location_id
             WHERE pbl.product_id = p.id),
            '[]'
        ) AS business_locations
    FROM products p
    LEFT JOIN units u ON u.id = p.unit_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
`;

const getAllProducts = async (clientId, { search, page, limit, locationId }) => {
    const offset = (page - 1) * limit;

        const query = `
        ${PRODUCT_SELECT}
        WHERE p.client_id = $1
                    AND ($2::uuid IS NULL OR EXISTS (
                            SELECT 1 FROM product_business_locations scoped_pbl
                            WHERE scoped_pbl.product_id = p.id
                                AND scoped_pbl.business_location_id = $2
                    ))
                    AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.sku ILIKE '%' || $3 || '%')
        ORDER BY p.created_at DESC
                LIMIT $4 OFFSET $5;
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM products p
                WHERE p.client_id = $1
                    AND ($2::uuid IS NULL OR EXISTS (
                            SELECT 1 FROM product_business_locations scoped_pbl
                            WHERE scoped_pbl.product_id = p.id
                                AND scoped_pbl.business_location_id = $2
                    ))
                    AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.sku ILIKE '%' || $3 || '%');
    `;

        const values = [clientId, locationId || null, search || null];

    const [rowsResult, countResult] = await Promise.all([
        pool.query(query, [...values, limit, offset]),
        pool.query(countQuery, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(countResult.rows[0].total),
    };
};

const findProductById = async (id, clientId, locationId = null) => {
    const query = `${PRODUCT_SELECT}
        WHERE p.id = $1
          AND p.client_id = $2
          AND ($3::uuid IS NULL OR EXISTS (
              SELECT 1 FROM product_business_locations scoped_pbl
              WHERE scoped_pbl.product_id = p.id
                AND scoped_pbl.business_location_id = $3
          ));`;

    const result = await pool.query(query, [id, clientId, locationId]);

    return result.rows[0];
};

module.exports = {
    createProduct,
    updateProduct,
    setProductLocations,
    getAllProducts,
    findProductById,
};