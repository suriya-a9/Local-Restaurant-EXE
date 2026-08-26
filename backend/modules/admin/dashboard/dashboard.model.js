const pool = require("../../../config/db");

const getClientStatusCounts = async () => {
    const query = `
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'active') AS active,
            COUNT(*) FILTER (WHERE status = 'trial') AS trial,
            COUNT(*) FILTER (WHERE status = 'inactive') AS inactive,
            COUNT(*) FILTER (WHERE status = 'suspended') AS suspended
        FROM clients;
    `;

    const result = await pool.query(query);

    return result.rows[0];
};

const getActiveSubscriptionCount = async () => {
    const query = `
        SELECT COUNT(*) AS total
        FROM client_subscriptions
        WHERE status = 'active';
    `;

    const result = await pool.query(query);

    return Number(result.rows[0].total);
};

const getPlanDistribution = async () => {
    const query = `
        SELECT sp.id, sp.name, COUNT(cs.id) AS client_count
        FROM subscription_plans sp
        LEFT JOIN client_subscriptions cs
            ON cs.subscription_plan_id = sp.id AND cs.status = 'active'
        GROUP BY sp.id, sp.name
        ORDER BY client_count DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
};

const getClientGrowth = async () => {
    const query = `
        SELECT
            COUNT(*) FILTER (
                WHERE created_at >= date_trunc('month', NOW())
            ) AS this_month,
            COUNT(*) FILTER (
                WHERE created_at >= date_trunc('month', NOW() - INTERVAL '1 month')
                  AND created_at < date_trunc('month', NOW())
            ) AS last_month
        FROM clients;
    `;

    const result = await pool.query(query);

    return result.rows[0];
};

const getFilteredClients = async (filters) => {
    const {
        status,
        plan_id,
        search,
        start_date,
        end_date,
        limit,
        offset,
    } = filters;

    const query = `
        SELECT
            c.id,
            c.business_name,
            c.name,
            c.email,
            c.phone,
            c.status,
            c.created_at,
            sp.id AS plan_id,
            sp.name AS plan_name
        FROM clients c
        LEFT JOIN LATERAL (
            SELECT cs.subscription_plan_id
            FROM client_subscriptions cs
            WHERE cs.client_id = c.id AND cs.status = 'active'
            ORDER BY cs.starts_at DESC
            LIMIT 1
        ) active_sub ON true
        LEFT JOIN subscription_plans sp ON sp.id = active_sub.subscription_plan_id
        WHERE ($1::text IS NULL OR c.status = $1)
          AND ($2::uuid IS NULL OR active_sub.subscription_plan_id = $2)
          AND (
              $3::text IS NULL
              OR c.business_name ILIKE '%' || $3 || '%'
              OR c.name ILIKE '%' || $3 || '%'
              OR c.email ILIKE '%' || $3 || '%'
          )
          AND ($4::timestamptz IS NULL OR c.created_at >= $4)
          AND ($5::timestamptz IS NULL OR c.created_at <= $5)
        ORDER BY c.created_at DESC
        LIMIT $6 OFFSET $7;
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM clients c
        LEFT JOIN LATERAL (
            SELECT cs.subscription_plan_id
            FROM client_subscriptions cs
            WHERE cs.client_id = c.id AND cs.status = 'active'
            ORDER BY cs.starts_at DESC
            LIMIT 1
        ) active_sub ON true
        WHERE ($1::text IS NULL OR c.status = $1)
          AND ($2::uuid IS NULL OR active_sub.subscription_plan_id = $2)
          AND (
              $3::text IS NULL
              OR c.business_name ILIKE '%' || $3 || '%'
              OR c.name ILIKE '%' || $3 || '%'
              OR c.email ILIKE '%' || $3 || '%'
          )
          AND ($4::timestamptz IS NULL OR c.created_at >= $4)
          AND ($5::timestamptz IS NULL OR c.created_at <= $5);
    `;

    const values = [
        status || null,
        plan_id || null,
        search || null,
        start_date || null,
        end_date || null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        pool.query(query, [...values, limit, offset]),
        pool.query(countQuery, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(countResult.rows[0].total),
    };
};

module.exports = {
    getClientStatusCounts,
    getActiveSubscriptionCount,
    getPlanDistribution,
    getClientGrowth,
    getFilteredClients,
};