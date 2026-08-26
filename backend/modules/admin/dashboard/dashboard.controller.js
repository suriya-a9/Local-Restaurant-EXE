const {
    getClientStatusCounts,
    getActiveSubscriptionCount,
    getPlanDistribution,
    getClientGrowth,
    getFilteredClients,
} = require("./dashboard.model");

const getStats = async (req, res) => {
    try {
        const [
            statusCounts,
            activeSubscriptions,
            planDistribution,
            growth,
        ] = await Promise.all([
            getClientStatusCounts(),
            getActiveSubscriptionCount(),
            getPlanDistribution(),
            getClientGrowth(),
        ]);

        const total = Number(statusCounts.total);
        const active = Number(statusCounts.active);

        const thisMonth = Number(growth.this_month);
        const lastMonth = Number(growth.last_month);

        const growthPercentage =
            lastMonth === 0
                ? thisMonth === 0
                    ? 0
                    : 100
                : ((thisMonth - lastMonth) / lastMonth) * 100;

        const plans = planDistribution.map((plan) => ({
            id: plan.id,
            name: plan.name,
            clients: Number(plan.client_count),
            percentage:
                activeSubscriptions === 0
                    ? 0
                    : Math.round(
                        (Number(plan.client_count) / activeSubscriptions) * 100
                    ),
        }));

        return res.status(200).json({
            success: true,
            data: {
                total_clients: total,
                active_clients: active,
                trial_clients: Number(statusCounts.trial),
                inactive_clients: Number(statusCounts.inactive),
                suspended_clients: Number(statusCounts.suspended),
                active_client_percentage:
                    total === 0 ? 0 : Math.round((active / total) * 100),
                active_subscriptions: activeSubscriptions,
                subscription_rate:
                    total === 0
                        ? 0
                        : Math.round((activeSubscriptions / total) * 100),
                plan_distribution: plans,
                growth: {
                    this_month: thisMonth,
                    last_month: lastMonth,
                    percentage: Number(growthPercentage.toFixed(1)),
                },
            },
        });

    } catch (error) {
        console.error("Get dashboard stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listDashboardClients = async (req, res) => {
    try {
        const {
            status,
            plan_id,
            search,
            start_date,
            end_date,
            page = 1,
            limit = 10,
        } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const offset = (pageNum - 1) * limitNum;

        const { rows, total } = await getFilteredClients({
            status,
            plan_id,
            search,
            start_date,
            end_date,
            limit: limitNum,
            offset,
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        });

    } catch (error) {
        console.error("List dashboard clients error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    getStats,
    listDashboardClients,
};