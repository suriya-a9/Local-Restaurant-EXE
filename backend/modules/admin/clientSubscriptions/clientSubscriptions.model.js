const pool = require("../../../config/db");

const getPlanById = async (planId) => {
    const result = await pool.query(
        `SELECT id, name, monthly_price, yearly_price FROM subscription_plans WHERE id = $1;`,
        [planId]
    );

    return result.rows[0];
};

const cancelActiveSubscriptions = async (clientId) => {
    await pool.query(
        `UPDATE client_subscriptions
         SET status = 'cancelled', updated_at = NOW()
         WHERE client_id = $1 AND status = 'active';`,
        [clientId]
    );
};

const createSubscription = async ({
    client_id,
    subscription_plan_id,
    billing_cycle,
    amount,
    starts_at,
    ends_at,
}) => {
    const query = `
        INSERT INTO client_subscriptions
            (client_id, subscription_plan_id, billing_cycle, amount, starts_at, ends_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *;
    `;

    const values = [
        client_id,
        subscription_plan_id,
        billing_cycle,
        amount,
        starts_at,
        ends_at,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const getCurrentSubscription = async (clientId) => {
    await pool.query(
        `UPDATE client_subscriptions
         SET status = 'expired', updated_at = NOW()
         WHERE client_id = $1 AND status = 'active' AND ends_at < NOW();`,
        [clientId]
    );

    const query = `
        SELECT cs.*, sp.name AS plan_name
        FROM client_subscriptions cs
        JOIN subscription_plans sp ON sp.id = cs.subscription_plan_id
        WHERE cs.client_id = $1 AND cs.status = 'active'
        ORDER BY cs.starts_at DESC
        LIMIT 1;
    `;

    const result = await pool.query(query, [clientId]);

    return result.rows[0] || null;
};

const getSubscriptionHistory = async (clientId) => {
    const query = `
        SELECT cs.*, sp.name AS plan_name
        FROM client_subscriptions cs
        JOIN subscription_plans sp ON sp.id = cs.subscription_plan_id
        WHERE cs.client_id = $1
        ORDER BY cs.starts_at DESC;
    `;

    const result = await pool.query(query, [clientId]);

    return result.rows;
};

const hasActiveSubscription = async (clientId) => {
    await pool.query(
        `UPDATE client_subscriptions
         SET status = 'expired', updated_at = NOW()
         WHERE client_id = $1 AND status = 'active' AND ends_at <= NOW();`,
        [clientId]
    );

    const result = await pool.query(
        `SELECT 1 FROM client_subscriptions
         WHERE client_id = $1 AND status = 'active' AND ends_at > NOW()
         LIMIT 1;`,
        [clientId]
    );

    return result.rowCount > 0;
};

const expireOverdueSubscriptions = async () => {
    const query = `
        UPDATE client_subscriptions
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND ends_at < NOW()
        RETURNING id, client_id;
    `;

    const result = await pool.query(query);

    return result.rows;
};

module.exports = {
    getPlanById,
    cancelActiveSubscriptions,
    createSubscription,
    getCurrentSubscription,
    getSubscriptionHistory,
    hasActiveSubscription,
    expireOverdueSubscriptions
};