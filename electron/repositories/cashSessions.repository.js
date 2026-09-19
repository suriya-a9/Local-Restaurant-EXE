const { randomUUID } = require('crypto');
const { getDatabase } = require('../database/sqlite');
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function getToday(clientId, locationId) {
    return getDatabase()
        .prepare(`
            SELECT *
            FROM pos_cash_sessions
            WHERE client_id = ?
              AND business_location_id = ?
              AND substr(business_date, 1, 10) = ?
            ORDER BY
                CASE WHEN status = 'open' THEN 0 ELSE 1 END,
                created_at DESC
            LIMIT 1
        `)
        .get(clientId, locationId, localDate()) || null;
}
function open(clientId, locationId, openingAmount) { const db = getDatabase(); const existing = getToday(clientId, locationId); if (existing) return existing; const id = randomUUID(); db.prepare(`INSERT INTO pos_cash_sessions(id,client_id,business_location_id,business_date,opening_amount,status,opened_at,created_at,updated_at) VALUES(?,?,?,?,?,'open',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(id, clientId, locationId, localDate(), Number(openingAmount) || 0); return getToday(clientId, locationId); }
function report(clientId, locationId, session = getToday(clientId, locationId)) { if (!session) throw new Error('No session for today'); const db = getDatabase(); const end = session.closed_at || new Date().toISOString(); const args = [clientId, locationId, session.opened_at, end]; const summary = db.prepare(`SELECT COUNT(*) AS sale_count,COALESCE(SUM(total_amount),0) total_sales,COALESCE(SUM(discount_amount),0) total_discount,COALESCE(SUM(order_tax_amount),0) total_tax FROM pos_sales WHERE client_id=? AND business_location_id=? AND status='completed' AND datetime(created_at)>=datetime(?) AND datetime(created_at)<=datetime(?)`).get(...args); const products = db.prepare(`SELECT p.id product_id,p.name product_name,si.unit_price_inc_tax unit_price,SUM(si.quantity) quantity,SUM(si.line_total) total_amount FROM pos_sale_items si JOIN pos_sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id WHERE s.client_id=? AND s.business_location_id=? AND s.status='completed' AND datetime(s.created_at)>=datetime(?) AND datetime(s.created_at)<=datetime(?) GROUP BY p.id,p.name,si.unit_price_inc_tax ORDER BY p.name,si.unit_price_inc_tax`).all(...args); const payments = db.prepare(`SELECT sp.payment_method,SUM(sp.amount) amount FROM pos_sale_payments sp JOIN pos_sales s ON s.id=sp.sale_id WHERE s.client_id=? AND s.business_location_id=? AND s.status='completed' AND datetime(s.created_at)>=datetime(?) AND datetime(s.created_at)<=datetime(?) GROUP BY sp.payment_method ORDER BY sp.payment_method`).all(...args); const cash = Number(payments.find(p => p.payment_method === 'cash')?.amount) || 0; const opening = Number(session.opening_amount) || 0; const closing = session.closing_amount == null ? null : Number(session.closing_amount); return { session, summary, products, payments, opening_amount: opening, cash_sales: cash, expected_cash: opening + cash, closing_amount: closing, difference: closing == null ? null : closing - (opening + cash) }; }
function close(clientId, locationId, closingAmount) { const db = getDatabase(); const session = getToday(clientId, locationId); if (!session) throw new Error('Open the day before closing'); if (session.status === 'closed') return report(clientId, locationId, session); const r = report(clientId, locationId, session); const actual = Number(closingAmount) || 0; db.prepare(`UPDATE pos_cash_sessions SET closing_amount=?,expected_cash=?,difference_amount=?,status='closed',closed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(actual, r.expected_cash, actual - r.expected_cash, session.id); return report(clientId, locationId, getToday(clientId, locationId)); }
module.exports = { getToday, open, report, close };
