const { getDatabase } = require("../database/sqlite");
function generateSku() {
    const timestamp =
        Date.now().toString(36).toUpperCase();

    const random =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    return `PRD-${timestamp}-${random}`;
}
function shapeProducts(rows) { const db = getDatabase(); const loc = db.prepare(`SELECT bl.id,bl.name,bl.code FROM product_business_locations pbl JOIN business_locations bl ON bl.id=pbl.business_location_id WHERE pbl.product_id=?`); return rows.map(p => ({ ...p, enable_stock: Boolean(p.enable_stock), unit: p.unit_id ? { id: p.unit_id, name: p.unit_name, short_name: p.unit_short_name } : null, category: p.category_id ? { id: p.category_id, name: p.category_name } : null, sub_category: p.sub_category_id ? { id: p.sub_category_id, name: p.sub_category_name } : null, business_locations: loc.all(p.id) })) }
function getAllProducts(clientId, locationId = null) { let sql = `SELECT p.*,u.name unit_name,u.short_name unit_short_name,c.name category_name,sc.name sub_category_name FROM products p LEFT JOIN units u ON u.id=p.unit_id LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN sub_categories sc ON sc.id=p.sub_category_id WHERE p.client_id=?`; const args = [clientId]; if (locationId) { sql += ` AND EXISTS(SELECT 1 FROM product_business_locations x WHERE x.product_id=p.id AND x.business_location_id=?)`; args.push(locationId) } sql += ` ORDER BY p.created_at DESC`; return shapeProducts(getDatabase().prepare(sql).all(...args)) }
function createProduct(d) {
    const db = getDatabase();

    const sku =
        d.sku && d.sku.trim()
            ? d.sku.trim()
            : generateSku();

    const transaction = db.transaction(() => {
        db.prepare(`
      INSERT INTO products (
        id,
        client_id,
        name,
        sku,
        barcode,
        shortcut_number,
        image,
        unit_id,
        category_id,
        sub_category_id,
        applicable_tax_id,
        product_type,
        selling_price_tax_type,
        enable_stock,
        alert_quantity,
        margin_percent,
        default_purchase_price_exc_tax,
        default_purchase_price_inc_tax,
        default_selling_price_exc_tax,
        default_selling_price_inc_tax,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `).run(
            d.id,
            d.client_id,
            d.name,
            sku,
            d.barcode || null,
            d.shortcut_number ?? null,
            d.image || null,
            d.unit_id || null,
            d.category_id || null,
            d.sub_category_id || null,
            d.applicable_tax_id || null,
            d.product_type || "single",
            d.selling_price_tax_type || "exclusive",
            d.enable_stock ? 1 : 0,
            d.alert_quantity ?? null,
            d.margin_percent || 0,
            d.default_purchase_price_exc_tax || 0,
            d.default_purchase_price_inc_tax || 0,
            d.default_selling_price_exc_tax || 0,
            d.default_selling_price_inc_tax || 0
        );

        const locationInsert = db.prepare(`
      INSERT INTO product_business_locations (
        product_id,
        business_location_id
      )
      VALUES (?, ?)
    `);

        for (
            const locationId
            of d.business_location_ids || []
        ) {
            locationInsert.run(
                d.id,
                locationId
            );
        }
    });

    transaction();

    return {
        success: true,
        id: d.id,
        sku,
    };
}
function updateProduct(d) { const db = getDatabase(); db.transaction(() => { const current = db.prepare("SELECT image FROM products WHERE id=? AND client_id=?").get(d.id, d.client_id); if (!current) throw new Error("Product not found"); db.prepare(`UPDATE products
SET
  name = ?,
  barcode = ?,
  shortcut_number = ?,
  image = ?,
  unit_id = ?,
  category_id = ?,
  sub_category_id = ?,
  applicable_tax_id = ?,
  product_type = ?,
  selling_price_tax_type = ?,
  enable_stock = ?,
  alert_quantity = ?,
  margin_percent = ?,
  default_purchase_price_exc_tax = ?,
  default_purchase_price_inc_tax = ?,
  default_selling_price_exc_tax = ?,
  default_selling_price_inc_tax = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
  AND client_id = ?`).run(d.name, d.barcode || null, d.shortcut_number ?? null, d.image === undefined ? current.image : d.image, d.unit_id || null, d.category_id || null, d.sub_category_id || null, d.applicable_tax_id || null, d.product_type || "single", d.selling_price_tax_type || "exclusive", d.enable_stock ? 1 : 0, d.alert_quantity ?? null, d.margin_percent || 0, d.default_purchase_price_exc_tax || 0, d.default_purchase_price_inc_tax || 0, d.default_selling_price_exc_tax || 0, d.default_selling_price_inc_tax || 0, d.id, d.client_id); db.prepare("DELETE FROM product_business_locations WHERE product_id=?").run(d.id); const st = db.prepare("INSERT INTO product_business_locations(product_id,business_location_id) VALUES(?,?)"); for (const id of d.business_location_ids || []) st.run(d.id, id) })(); return { success: true } }
module.exports = { getAllProducts, createProduct, updateProduct };
