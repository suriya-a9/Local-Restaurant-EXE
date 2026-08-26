const { createSale, getSaleById, listSales, cancelSale } = require("./sales.model");

const SALE_TYPES = new Set(["dining", "parcel", "zomato", "swiggy", "delivery"]);
const PAYMENT_METHODS = new Set(["cash", "card", "gpay", "credit"]);

const numberValue = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const validateSale = (body) => {
    const errors = [];
    const items = Array.isArray(body.items) ? body.items : [];
    const payments = Array.isArray(body.payments) ? body.payments : [];

    if (!body.business_location_id) errors.push("Business location is required");
    if (!SALE_TYPES.has(body.sale_type)) errors.push("Invalid sale type");
    if (items.length === 0) errors.push("At least one product is required");
    if (payments.length === 0) errors.push("At least one payment is required");

    for (const item of items) {
        if (!item.product_id) errors.push("Each item must have a product");
        if (numberValue(item.quantity) <= 0) errors.push("Item quantity must be positive");
        if (numberValue(item.unit_price_inc_tax) < 0) errors.push("Item price cannot be negative");
        if (numberValue(item.discount_amount) < 0) errors.push("Item discount cannot be negative");
    }

    for (const payment of payments) {
        if (!PAYMENT_METHODS.has(payment.payment_method)) errors.push("Invalid payment method");
        if (numberValue(payment.amount) <= 0) errors.push("Payment amount must be positive");
    }

    return { errors, items, payments };
};

const addSale = async (req, res) => {
    try {
        const { errors, items, payments } = validateSale(req.body);

        if (req.user.business_location_id &&
            String(req.body.business_location_id) !== String(req.user.business_location_id)) {
            errors.push("Sale location must match your assigned business location");
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0], errors });
        }

        const discountAmount = numberValue(req.body.discount_amount);
        const taxAmount = numberValue(req.body.order_tax_amount);
        const roundOffAmount = numberValue(req.body.round_off_amount);

        if (discountAmount < 0 || taxAmount < 0) {
            return res.status(400).json({ success: false, message: "Discount and tax cannot be negative" });
        }

        const saleItems = items.map((item) => ({
            productId: item.product_id,
            quantity: numberValue(item.quantity),
            unitPrice: numberValue(item.unit_price_inc_tax),
            discountAmount: numberValue(item.discount_amount),
        }));
        const salePayments = payments.map((payment) => ({
            paymentMethod: payment.payment_method,
            amount: numberValue(payment.amount),
        }));
        const subtotal = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discountAmount, 0);
        // Item prices are stored inclusive of tax; taxAmount is informational.
        const totalAmount = subtotal - discountAmount + roundOffAmount;
        const paymentTotal = salePayments.reduce((sum, payment) => sum + payment.amount, 0);

        if (totalAmount < 0 || Math.abs(paymentTotal - totalAmount) > 0.01) {
            return res.status(400).json({ success: false, message: "Payment total must match the sale total" });
        }

        const sale = await createSale({
            clientId: req.user.id,
            locationId: req.user.business_location_id || req.body.business_location_id,
            saleType: req.body.sale_type,
            customerName: String(req.body.customer_name || "Walk-In Customer").trim() || "Walk-In Customer",
            discountAmount,
            taxAmount,
            roundOffAmount,
            items: saleItems,
            payments: salePayments,
        });

        return res.status(201).json({ success: true, message: "Sale created successfully", data: sale });
    } catch (error) {
        console.error("Create sale error:", error);
        return res.status(400).json({ success: false, message: error.message || "Failed to create sale" });
    }
};

const getSales = async (req, res) => {
    try {
        const sales = await listSales(
            req.user.id,
            req.user.business_location_id || req.query.business_location_id
        );
        return res.json({ success: true, data: sales });
    } catch (error) {
        console.error("List sales error:", error);
        return res.status(500).json({ success: false, message: "Failed to load sales" });
    }
};

const getSale = async (req, res) => {
    try {
        const sale = await getSaleById(req.user.id, req.params.id, undefined, req.user.business_location_id);
        if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
        return res.json({ success: true, data: sale });
    } catch (error) {
        console.error("Get sale error:", error);
        return res.status(500).json({ success: false, message: "Failed to load sale" });
    }
};

const removeSale = async (req, res) => {
    try {
        const sale = await cancelSale(req.user.id, req.params.id, req.user.business_location_id);
        if (!sale) return res.status(404).json({ success: false, message: "Sale not found or already cancelled" });
        return res.json({ success: true, message: "Sale cancelled successfully", data: sale });
    } catch (error) {
        console.error("Cancel sale error:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel sale" });
    }
};

module.exports = { addSale, getSales, getSale, removeSale };