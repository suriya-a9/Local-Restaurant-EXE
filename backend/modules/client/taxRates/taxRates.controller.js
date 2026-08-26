// taxRates.controller.js
const { createTaxRate, getAllTaxRates } = require("./taxRates.model");

const addTaxRate = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { name, rate_percent, tax_type, is_active } = req.body;

        if (!name || !name.trim() || rate_percent === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name and rate_percent are required",
            });
        }

        const taxRate = await createTaxRate(clientId, {
            name: name.trim(),
            rate_percent: Number(rate_percent),
            tax_type,
            is_active,
        });

        return res.status(201).json({
            success: true,
            message: "Tax rate created successfully",
            data: taxRate,
        });

    } catch (error) {
        console.error("Create tax rate error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listTaxRates = async (req, res) => {
    try {
        const clientId = req.user.id;

        const taxRates = await getAllTaxRates(clientId);

        return res.status(200).json({
            success: true,
            data: taxRates,
        });

    } catch (error) {
        console.error("List tax rates error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    addTaxRate,
    listTaxRates,
};