const pool = require("../../../config/db");

const findLocationForClient = async (locationId, clientId) => {
    const result = await pool.query(
        `SELECT id FROM business_locations WHERE id = $1 AND client_id = $2`,
        [locationId, clientId]
    );

    return result.rows[0] || null;
};

const getSummary = async (clientId, { locationId, fromDate, toDate }) => {
    const values = [clientId, fromDate, toDate];
    const locationFilter = locationId
        ? "AND s.business_location_id = $4"
        : "";

    if (locationId) {
        values.push(locationId);
    }

    const result = await pool.query(
        `WITH filtered_sales AS (
            SELECT s.id, s.total_amount, s.payment_status
            FROM pos_sales s
            WHERE s.client_id = $1
              AND s.status <> 'cancelled'
              AND s.created_at >= $2::date
              AND s.created_at < ($3::date + INTERVAL '1 day')
              ${locationFilter}
        ), payment_totals AS (
            SELECT sp.sale_id, SUM(sp.amount) AS paid_amount
            FROM pos_sale_payments sp
            JOIN filtered_sales fs ON fs.id = sp.sale_id
            GROUP BY sp.sale_id
        ), payment_breakdown AS (
            SELECT
                COALESCE(SUM(sp.amount) FILTER (WHERE sp.payment_method = 'cash'), 0) AS cash,
                COALESCE(SUM(sp.amount) FILTER (WHERE sp.payment_method = 'card'), 0) AS card,
                COALESCE(SUM(sp.amount) FILTER (WHERE sp.payment_method = 'gpay'), 0) AS gpay,
                COALESCE(SUM(sp.amount) FILTER (WHERE sp.payment_method = 'credit'), 0) AS credit
            FROM pos_sale_payments sp
            JOIN filtered_sales fs ON fs.id = sp.sale_id
        )
        SELECT
            COUNT(fs.id)::integer AS total_orders,
            COALESCE(SUM(fs.total_amount), 0) AS total_sales_amount,
            COALESCE(SUM(
                CASE
                    WHEN fs.payment_status = 'credit' THEN fs.total_amount
                    WHEN fs.payment_status = 'partial' THEN GREATEST(fs.total_amount - COALESCE(pt.paid_amount, 0), 0)
                    ELSE 0
                END
            ), 0) AS total_due_amount,
            pb.cash,
            pb.card,
            pb.gpay,
            pb.credit
        FROM filtered_sales fs
        LEFT JOIN payment_totals pt ON pt.sale_id = fs.id
        CROSS JOIN payment_breakdown pb
        GROUP BY pb.cash, pb.card, pb.gpay, pb.credit`,
        values
    );

    return result.rows[0] || {
        total_orders: 0,
        total_sales_amount: 0,
        total_due_amount: 0,
        cash: 0,
        card: 0,
        gpay: 0,
        credit: 0,
    };
};

module.exports = { findLocationForClient, getSummary };