const {
    createPlan,
    setPlanFeatures,
    getAllPlans,
    findPlanById,
    updatePlan,
    deletePlan,
} = require("./subscriptionPlans.model");

const buildPlanPayload = (body) => ({
    name: body.name,
    description: body.description || null,
    monthly_price: body.monthly_price ?? null,
    yearly_price: body.yearly_price ?? null,
    max_branches: body.max_branches ?? null,
    max_users: body.max_users ?? null,
    max_products: body.max_products ?? null,
    is_active: body.is_active ?? true,
});

const addPlan = async (req, res) => {
    try {
        const { name, features } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Plan name is required",
            });
        }

        const plan = await createPlan(buildPlanPayload(req.body));

        await setPlanFeatures(plan.id, features || []);

        const fullPlan = await findPlanById(plan.id);

        return res.status(201).json({
            success: true,
            message: "Subscription plan created successfully",
            data: fullPlan,
        });

    } catch (error) {
        console.error("Create subscription plan error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listPlans = async (req, res) => {
    try {
        const plans = await getAllPlans();

        return res.status(200).json({
            success: true,
            data: plans,
        });

    } catch (error) {
        console.error("List subscription plans error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const getPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await findPlanById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Subscription plan not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: plan,
        });

    } catch (error) {
        console.error("Get subscription plan error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, features } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Plan name is required",
            });
        }

        const existingPlan = await findPlanById(id);

        if (!existingPlan) {
            return res.status(404).json({
                success: false,
                message: "Subscription plan not found",
            });
        }

        await updatePlan(id, buildPlanPayload(req.body));

        await setPlanFeatures(id, features || []);

        const fullPlan = await findPlanById(id);

        return res.status(200).json({
            success: true,
            message: "Subscription plan updated successfully",
            data: fullPlan,
        });

    } catch (error) {
        console.error("Update subscription plan error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const removePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPlan = await findPlanById(id);

        if (!existingPlan) {
            return res.status(404).json({
                success: false,
                message: "Subscription plan not found",
            });
        }

        const plan = await deletePlan(id);

        return res.status(200).json({
            success: true,
            message: "Subscription plan deleted successfully",
            data: plan,
        });

    } catch (error) {
        console.error("Delete subscription plan error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    addPlan,
    listPlans,
    getPlan,
    editPlan,
    removePlan,
};