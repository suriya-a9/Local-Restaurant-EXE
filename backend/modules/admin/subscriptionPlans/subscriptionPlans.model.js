const pool = require("../../../config/db");

const createPlan = async (planData) => {
    const {
        name,
        description,
        monthly_price,
        yearly_price,
        max_branches,
        max_users,
        max_products,
        is_active,
    } = planData;

    const query = `
        INSERT INTO subscription_plans
            (name, description, monthly_price, yearly_price, max_branches, max_users, max_products, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

    const values = [
        name,
        description,
        monthly_price,
        yearly_price,
        max_branches,
        max_users,
        max_products,
        is_active,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const setPlanFeatures = async (planId, features) => {
    await pool.query(
        `DELETE FROM plan_features WHERE plan_id = $1;`,
        [planId]
    );

    if (!features || features.length === 0) {
        return;
    }

    const values = [];
    const placeholders = features
        .map((feature, index) => {
            const base = index * 3;
            values.push(planId, feature.feature_id, feature.enabled ?? true);
            return `($${base + 1}, $${base + 2}, $${base + 3})`;
        })
        .join(", ");

    const query = `
        INSERT INTO plan_features (plan_id, feature_id, enabled)
        VALUES ${placeholders};
    `;

    await pool.query(query, values);
};

const getAllPlans = async () => {
    const plansResult = await pool.query(`
        SELECT * FROM subscription_plans
        ORDER BY created_at DESC;
    `);

    const plans = plansResult.rows;

    if (plans.length === 0) {
        return [];
    }

    const featuresResult = await pool.query(`
        SELECT pf.plan_id, pf.feature_id, pf.enabled, f.name
        FROM plan_features pf
        JOIN features f ON f.id = pf.feature_id
        WHERE pf.plan_id = ANY($1::uuid[]);
    `, [plans.map((plan) => plan.id)]);

    const featuresByPlan = {};

    featuresResult.rows.forEach((row) => {
        if (!featuresByPlan[row.plan_id]) {
            featuresByPlan[row.plan_id] = [];
        }
        featuresByPlan[row.plan_id].push({
            feature_id: row.feature_id,
            name: row.name,
            enabled: row.enabled,
        });
    });

    return plans.map((plan) => ({
        ...plan,
        features: featuresByPlan[plan.id] || [],
    }));
};

const findPlanById = async (id) => {
    const planResult = await pool.query(
        `SELECT * FROM subscription_plans WHERE id = $1;`,
        [id]
    );

    const plan = planResult.rows[0];

    if (!plan) {
        return null;
    }

    const featuresResult = await pool.query(`
        SELECT pf.feature_id, pf.enabled, f.name
        FROM plan_features pf
        JOIN features f ON f.id = pf.feature_id
        WHERE pf.plan_id = $1;
    `, [id]);

    return {
        ...plan,
        features: featuresResult.rows,
    };
};

const updatePlan = async (id, planData) => {
    const {
        name,
        description,
        monthly_price,
        yearly_price,
        max_branches,
        max_users,
        max_products,
        is_active,
    } = planData;

    const query = `
        UPDATE subscription_plans
        SET name = $1,
            description = $2,
            monthly_price = $3,
            yearly_price = $4,
            max_branches = $5,
            max_users = $6,
            max_products = $7,
            is_active = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *;
    `;

    const values = [
        name,
        description,
        monthly_price,
        yearly_price,
        max_branches,
        max_users,
        max_products,
        is_active,
        id,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const deletePlan = async (id) => {
    const query = `
        DELETE FROM subscription_plans
        WHERE id = $1
        RETURNING id, name;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

module.exports = {
    createPlan,
    setPlanFeatures,
    getAllPlans,
    findPlanById,
    updatePlan,
    deletePlan,
};