const { findLocationForClient, getSummary } = require("./dashboard.model");

const PERIODS = new Set([
    "today",
    "yesterday",
    "this_week",
    "this_month",
    "this_year",
    "last_year",
    "custom",
]);

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const getPeriodDates = (period, fromDate, toDate) => {
    if (period === "custom") {
        if (!datePattern.test(fromDate || "") || !datePattern.test(toDate || "")) {
            throw new Error("Custom period requires valid from_date and to_date");
        }

        if (fromDate > toDate) {
            throw new Error("from_date cannot be after to_date");
        }

        return { fromDate, toDate };
    }

    const today = new Date();
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const iso = (value) => value.toISOString().slice(0, 10);
    const startOfWeek = new Date(date);
    startOfWeek.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));

    switch (period) {
        case "yesterday": {
            const yesterday = new Date(date);
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            return { fromDate: iso(yesterday), toDate: iso(yesterday) };
        }
        case "this_week": {
            const end = new Date(startOfWeek);
            end.setUTCDate(end.getUTCDate() + 6);
            return { fromDate: iso(startOfWeek), toDate: iso(end) };
        }
        case "this_month": {
            const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
            const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
            return { fromDate: iso(start), toDate: iso(end) };
        }
        case "this_year": {
            return {
                fromDate: `${date.getUTCFullYear()}-01-01`,
                toDate: `${date.getUTCFullYear()}-12-31`,
            };
        }
        case "last_year": {
            const year = date.getUTCFullYear() - 1;
            return { fromDate: `${year}-01-01`, toDate: `${year}-12-31` };
        }
        case "today":
        default:
            return { fromDate: iso(date), toDate: iso(date) };
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const period = req.query.period || "today";

        if (!PERIODS.has(period)) {
            return res.status(400).json({ success: false, message: "Invalid period" });
        }

        const { fromDate, toDate } = getPeriodDates(
            period,
            req.query.from_date,
            req.query.to_date
        );
        const locationId = req.query.business_location_id || null;

        if (locationId && !(await findLocationForClient(locationId, req.user.id))) {
            return res.status(400).json({
                success: false,
                message: "Business location does not belong to this client",
            });
        }

        const summary = await getSummary(req.user.id, {
            locationId,
            fromDate,
            toDate,
        });

        return res.json({
            success: true,
            data: {
                from_date: fromDate,
                to_date: toDate,
                total_orders: Number(summary.total_orders || 0),
                total_sales_amount: Number(summary.total_sales_amount || 0),
                total_due_amount: Number(summary.total_due_amount || 0),
                payment_breakdown: {
                    cash: Number(summary.cash || 0),
                    card: Number(summary.card || 0),
                    gpay: Number(summary.gpay || 0),
                    credit: Number(summary.credit || 0),
                },
            },
        });
    } catch (error) {
        console.error("Get client dashboard summary error:", error);
        return res.status(400).json({ success: false, message: error.message || "Failed to load dashboard summary" });
    }
};

module.exports = { getDashboardSummary };