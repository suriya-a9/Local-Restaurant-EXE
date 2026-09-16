const pool = require('../../../config/db');

async function getTodaySession(clientId, locationId) {
  const r = await pool.query(`SELECT * FROM pos_cash_sessions WHERE client_id=$1 AND business_location_id=$2 AND business_date=CURRENT_DATE LIMIT 1`, [clientId, locationId]);
  return r.rows[0] || null;
}

async function openSession(clientId, locationId, openingAmount) {
  const existing = await getTodaySession(clientId, locationId);
  if (existing) return existing;
  const r = await pool.query(`INSERT INTO pos_cash_sessions(client_id,business_location_id,business_date,opening_amount,status,opened_at)
    VALUES($1,$2,CURRENT_DATE,$3,'open',now()) RETURNING *`, [clientId, locationId, Number(openingAmount)||0]);
  return r.rows[0];
}

async function getReport(clientId, locationId, session) {
  const end = session.closed_at || new Date();
  const [summary, products, payments] = await Promise.all([
    pool.query(`SELECT COUNT(*) FILTER (WHERE status='completed')::int AS sale_count,
      COALESCE(SUM(total_amount) FILTER (WHERE status='completed'),0) AS total_sales,
      COALESCE(SUM(discount_amount) FILTER (WHERE status='completed'),0) AS total_discount,
      COALESCE(SUM(order_tax_amount) FILTER (WHERE status='completed'),0) AS total_tax
      FROM pos_sales WHERE client_id=$1 AND business_location_id=$2 AND created_at >= $3 AND created_at <= $4`, [clientId,locationId,session.opened_at,end]),
    pool.query(`SELECT p.id AS product_id,p.name AS product_name, si.unit_price_inc_tax AS unit_price, SUM(si.quantity) AS quantity,
      SUM(si.line_total) AS total_amount
      FROM pos_sale_items si JOIN pos_sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
      WHERE s.client_id=$1 AND s.business_location_id=$2 AND s.status='completed' AND s.created_at >= $3 AND s.created_at <= $4
      GROUP BY p.id,p.name,si.unit_price_inc_tax ORDER BY p.name,si.unit_price_inc_tax`, [clientId,locationId,session.opened_at,end]),
    pool.query(`SELECT sp.payment_method,COALESCE(SUM(sp.amount),0) AS amount
      FROM pos_sale_payments sp JOIN pos_sales s ON s.id=sp.sale_id
      WHERE s.client_id=$1 AND s.business_location_id=$2 AND s.status='completed' AND s.created_at >= $3 AND s.created_at <= $4
      GROUP BY sp.payment_method ORDER BY sp.payment_method`, [clientId,locationId,session.opened_at,end])
  ]);
  const paymentMap = Object.fromEntries(payments.rows.map(r=>[r.payment_method,Number(r.amount)||0]));
  const opening = Number(session.opening_amount)||0;
  const cashSales = paymentMap.cash || 0;
  return { session, summary: summary.rows[0], products: products.rows, payments: payments.rows,
    opening_amount: opening, cash_sales: cashSales, expected_cash: opening + cashSales,
    closing_amount: session.closing_amount == null ? null : Number(session.closing_amount),
    difference: session.closing_amount == null ? null : Number(session.closing_amount) - (opening + cashSales) };
}

async function closeSession(clientId, locationId, closingAmount) {
  const session = await getTodaySession(clientId, locationId);
  if (!session) throw new Error('Open the day before closing');
  if (session.status === 'closed') return getReport(clientId, locationId, session);
  const report = await getReport(clientId, locationId, session);
  const actual = Number(closingAmount)||0;
  const r = await pool.query(`UPDATE pos_cash_sessions SET closing_amount=$1,expected_cash=$2,difference_amount=$3,status='closed',closed_at=now(),updated_at=now() WHERE id=$4 RETURNING *`,
    [actual,report.expected_cash,actual-report.expected_cash,session.id]);
  return getReport(clientId, locationId, r.rows[0]);
}

module.exports={getTodaySession,openSession,getReport,closeSession};
