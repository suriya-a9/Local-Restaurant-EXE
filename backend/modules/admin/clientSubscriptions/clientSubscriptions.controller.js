const { findClientById } = require("../clients/clients.model");

const {
    getPlanById,
    cancelActiveSubscriptions,
    createSubscription,
    getCurrentSubscription,
    getSubscriptionHistory,
} = require("./clientSubscriptions.model");

const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

const addYears = (date, years) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
};

const assignPlan = async (req, res) => {
    try {
        const { id: clientId } = req.params;
        const { subscription_plan_id, billing_cycle } = req.body;

        if (!subscription_plan_id) {
            return res.status(400).json({
                success: false,
                message: "subscription_plan_id is required",
            });
        }

        if (!["monthly", "yearly"].includes(billing_cycle)) {
            return res.status(400).json({
                success: false,
                message: "billing_cycle must be 'monthly' or 'yearly'",
            });
        }

        const client = await findClientById(clientId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const plan = await getPlanById(subscription_plan_id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Subscription plan not found",
            });
        }

        const startsAt = new Date();

        const endsAt =
            billing_cycle === "monthly"
                ? addMonths(startsAt, 1)
                : addYears(startsAt, 1);

        const amount =
            billing_cycle === "monthly"
                ? plan.monthly_price
                : plan.yearly_price;

        await cancelActiveSubscriptions(clientId);

        const subscription = await createSubscription({
            client_id: clientId,
            subscription_plan_id,
            billing_cycle,
            amount,
            starts_at: startsAt,
            ends_at: endsAt,
        });

        return res.status(201).json({
            success: true,
            message: "Subscription plan assigned successfully",
            data: subscription,
        });

    } catch (error) {
        console.error("Assign plan error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const currentSubscription = async (req, res) => {
    try {
        const { id: clientId } = req.params;

        const client = await findClientById(clientId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const subscription = await getCurrentSubscription(clientId);

        return res.status(200).json({
            success: true,
            data: subscription,
        });

    } catch (error) {
        console.error("Get current subscription error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const subscriptionHistory = async (req, res) => {
    try {
        const { id: clientId } = req.params;

        const client = await findClientById(clientId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const history = await getSubscriptionHistory(clientId);

        return res.status(200).json({
            success: true,
            data: history,
        });

    } catch (error) {
        console.error("Get subscription history error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    assignPlan,
    currentSubscription,
    subscriptionHistory,
};