const pool = require("../../../config/db");

const createInvoiceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `POS-${timestamp}-${random}`;
};

const createSale = async ({ clientId, locationId, saleType, customerName, discountAmount, taxAmount, roundOffAmount, items, payments }) => {
    await pool.saleNumberMigration;
    const connection = await pool.connect();

    try {
        await connection.query("BEGIN");

        const locationResult = await connection.query(
            "SELECT id FROM business_locations WHERE id = $1 AND client_id = $2",
            [locationId, clientId]
        );

        await pool.cashSessionMigration;
        const cashSessionResult = await connection.query(
            "SELECT id,status FROM pos_cash_sessions WHERE client_id=$1 AND business_location_id=$2 AND business_date=CURRENT_DATE LIMIT 1",
            [clientId, locationId]
        );
        if (!cashSessionResult.rows[0] || cashSessionResult.rows[0].status !== "open") {
            throw new Error("Open today's cash session before creating sales");
        }

        if (locationResult.rowCount === 0) {
            throw new Error("Business location does not belong to this client");
        }

        const productIds = [...new Set(items.map((item) => item.productId))];
        const productResult = await connection.query(
            `SELECT p.id
             FROM products p
             JOIN product_business_locations pbl ON pbl.product_id = p.id
             WHERE p.client_id = $1
               AND pbl.business_location_id = $2
               AND p.id = ANY($3::uuid[])`,
            [clientId, locationId, productIds]
        );

        if (productResult.rowCount !== productIds.length) {
            throw new Error("One or more products are not available at this location");
        }

        const subtotal = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice - item.discountAmount,
            0
        );
        const totalAmount = subtotal - discountAmount + roundOffAmount;
        const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const paymentStatus = payments.some((payment) => payment.paymentMethod === "credit")
            ? "credit"
            : Math.abs(paidAmount - totalAmount) <= 0.01
                ? "paid"
                : "partial";

        const saleResult = await connection.query(
            `INSERT INTO pos_sales
                (client_id, business_location_id, invoice_number, sale_type, customer_name,
                 subtotal, discount_amount, order_tax_amount, round_off_amount, total_amount, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [clientId, locationId, createInvoiceNumber(), saleType, customerName,
                subtotal.toFixed(2), discountAmount, taxAmount, roundOffAmount,
                totalAmount.toFixed(2), paymentStatus]
        );

        const sale = saleResult.rows[0];

        for (const item of items) {
            const lineTotal = item.quantity * item.unitPrice - item.discountAmount;
            await connection.query(
                `INSERT INTO pos_sale_items
                    (sale_id, product_id, quantity, unit_price_inc_tax, discount_amount, line_total)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sale.id, item.productId, item.quantity, item.unitPrice,
                item.discountAmount, lineTotal.toFixed(2)]
            );
        }

        for (const payment of payments) {
            await connection.query(
                `INSERT INTO pos_sale_payments (sale_id, payment_method, amount)
                 VALUES ($1, $2, $3)`,
                [sale.id, payment.paymentMethod, payment.amount]
            );
        }

        await connection.query("COMMIT");
        return getSaleById(clientId, sale.id, connection);
    } catch (error) {
        await connection.query("ROLLBACK");
        throw error;
    } finally {
        connection.release();
    }
};

const saleSelect = `
    SELECT
        s.*,
        bl.name AS business_location_name,
                COALESCE((SELECT json_agg(
                                        json_build_object(
                                                'id', si.id,
                                                'sale_id', si.sale_id,
                                                'product_id', si.product_id,
                                                'product_name', p.name,
                                                'selling_price_tax_type', p.selling_price_tax_type,
                                                'default_selling_price_exc_tax', p.default_selling_price_exc_tax,
                                                'quantity', si.quantity,
                                                'unit_price_inc_tax', si.unit_price_inc_tax,
                                                'discount_amount', si.discount_amount,
                                                'line_total', si.line_total,
                                                'created_at', si.created_at
                                        ) ORDER BY si.created_at
                                    )
                                    FROM pos_sale_items si
                                    JOIN products p ON p.id = si.product_id
                                    WHERE si.sale_id = s.id), '[]') AS items,
        COALESCE((SELECT json_agg(sp ORDER BY sp.created_at)
                  FROM pos_sale_payments sp WHERE sp.sale_id = s.id), '[]') AS payments
    FROM pos_sales s
    JOIN business_locations bl ON bl.id = s.business_location_id
`;

const getSaleById = async (clientId, saleId, connection = pool, locationId = null) => {
    const result = await connection.query(
        `${saleSelect} WHERE s.client_id = $1 AND s.id = $2
         AND ($3::uuid IS NULL OR s.business_location_id = $3)`,
        [clientId, saleId, locationId]
    );
    return result.rows[0] || null;
};

const listSales = async (clientId, locationId) => {
    const values = [clientId];
    let locationFilter = "";

    if (locationId) {
        values.push(locationId);
        locationFilter = ` AND s.business_location_id = $${values.length}`;
    }

    const result = await pool.query(
        `${saleSelect}
         WHERE s.client_id = $1${locationFilter}
         ORDER BY s.created_at DESC`,
        values
    );
    return result.rows;
};

const cancelSale = async (clientId, saleId, locationId = null) => {
    const result = await pool.query(
        `UPDATE pos_sales
         SET status = 'cancelled', payment_status = 'cancelled', updated_at = now()
                 WHERE id = $1 AND client_id = $2
                     AND ($3::uuid IS NULL OR business_location_id = $3)
                     AND status <> 'cancelled'
         RETURNING *`,
        [saleId, clientId, locationId]
    );
    return result.rows[0] || null;
};

module.exports = { createSale, getSaleById, listSales, cancelSale };