const { randomUUID } = require('crypto');
const { getDatabase } = require('../database/sqlite');

function createInvoiceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `POS-${timestamp}-${random}`;
}

function shapeSale(row) {
  if (!row) return null;
  const db = getDatabase();
  const items = db.prepare(`
        SELECT si.*, p.name AS product_name, p.selling_price_tax_type,
          p.default_selling_price_exc_tax, p.category_id,
          c.name AS category_name
    FROM pos_sale_items si
    JOIN products p ON p.id = si.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE si.sale_id = ? ORDER BY si.created_at ASC
  `).all(row.id);
  const payments = db.prepare('SELECT * FROM pos_sale_payments WHERE sale_id = ? ORDER BY created_at ASC').all(row.id);
  return { ...row, items, payments };
}

function getSaleById(clientId, saleId, locationId = null) {
  const db = getDatabase();
  let sql = `SELECT s.*,
                    bl.name AS business_location_name,
                    bl.address AS business_location_address,
                    bl.city AS business_location_city,
                    bl.state AS business_location_state,
                    bl.country AS business_location_country,
                    bl.postal_code AS business_location_postal_code,
                    bl.phone AS business_location_phone,
                    bl.email AS business_location_email,
                    bl.gst_number AS business_location_gst_number
             FROM pos_sales s JOIN business_locations bl ON bl.id = s.business_location_id
             WHERE s.client_id = ? AND s.id = ?`;
  const args = [clientId, saleId];
  if (locationId) { sql += ' AND s.business_location_id = ?'; args.push(locationId); }
  return shapeSale(db.prepare(sql).get(...args));
}

function listSales(clientId, locationId = null) {
  const db = getDatabase();
  let sql = `SELECT s.*, bl.name AS business_location_name
             FROM pos_sales s JOIN business_locations bl ON bl.id = s.business_location_id
             WHERE s.client_id = ?`;
  const args = [clientId];
  if (locationId) { sql += ' AND s.business_location_id = ?'; args.push(locationId); }
  sql += ' ORDER BY s.created_at DESC';
  return db.prepare(sql).all(...args).map(shapeSale);
}

function createSale(data) {
  const db = getDatabase();
  const items = Array.isArray(data.items) ? data.items : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];
  if (!data.client_id || !data.business_location_id) throw new Error('Client and business location are required');
  if (!items.length) throw new Error('Add at least one item');

  const transaction = db.transaction(() => {
    const location = db.prepare('SELECT id FROM business_locations WHERE id = ? AND client_id = ?').get(data.business_location_id, data.client_id);
    if (!location) throw new Error('Business location does not belong to this client');

    const available = db.prepare(`SELECT 1 FROM products p
      JOIN product_business_locations pbl ON pbl.product_id = p.id
      WHERE p.id = ? AND p.client_id = ? AND pbl.business_location_id = ?`);
    for (const item of items) {
      if (!available.get(item.product_id, data.client_id, data.business_location_id)) {
        throw new Error('One or more products are not available at this location');
      }
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price_inc_tax) - Number(item.discount_amount || 0), 0);
    const discountAmount = Number(data.discount_amount || 0);
    const taxAmount = Number(data.order_tax_amount || 0);
    const roundOffAmount = Number(data.round_off_amount || 0);
    const totalAmount = subtotal - discountAmount + roundOffAmount;
    const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const paymentStatus = payments.some((payment) => payment.payment_method === 'credit')
      ? 'credit' : Math.abs(paidAmount - totalAmount) <= 0.01 ? 'paid' : 'partial';

    const saleId = data.id || randomUUID();
    const invoiceNumber = data.invoice_number || createInvoiceNumber();
    db.prepare(`INSERT INTO pos_sales
      (id, client_id, business_location_id, invoice_number, sale_type, customer_name,
       subtotal, discount_amount, order_tax_amount, round_off_amount, total_amount, payment_status, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
      .run(saleId, data.client_id, data.business_location_id, invoiceNumber, data.sale_type || 'dining',
        data.customer_name || 'Walk-In Customer', subtotal, discountAmount, taxAmount, roundOffAmount, totalAmount, paymentStatus);

    const insertItem = db.prepare(`INSERT INTO pos_sale_items
      (id, sale_id, product_id, quantity, unit_price_inc_tax, discount_amount, line_total, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.unit_price_inc_tax) - Number(item.discount_amount || 0);
      insertItem.run(randomUUID(), saleId, item.product_id, Number(item.quantity), Number(item.unit_price_inc_tax), Number(item.discount_amount || 0), lineTotal);
    }

    const insertPayment = db.prepare(`INSERT INTO pos_sale_payments
      (id, sale_id, payment_method, amount, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`);
    for (const payment of payments) {
      insertPayment.run(randomUUID(), saleId, payment.payment_method, Number(payment.amount || 0));
    }
    return saleId;
  });

  const saleId = transaction();
  return getSaleById(data.client_id, saleId, data.business_location_id);
}

function cancelSale(clientId, saleId, locationId = null) {
  const db = getDatabase();
  let sql = `UPDATE pos_sales SET status = 'cancelled', payment_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND client_id = ? AND status <> 'cancelled'`;
  const args = [saleId, clientId];
  if (locationId) { sql += ' AND business_location_id = ?'; args.push(locationId); }
  const result = db.prepare(sql).run(...args);
  if (!result.changes) throw new Error('Sale not found or already cancelled');
  return getSaleById(clientId, saleId, locationId);
}

module.exports = { createSale, listSales, getSaleById, cancelSale };