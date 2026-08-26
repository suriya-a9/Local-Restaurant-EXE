const { createCustomer, getCustomers } = require("./customers.model");

const listCustomers = async (req, res) => {
    try {
        const locationId = req.user.business_location_id || req.query.business_location_id;
        const customers = await getCustomers(req.user.id, locationId, req.query.search);

        return res.status(200).json({ success: true, data: customers });
    } catch (error) {
        console.error("List customers error:", error);
        return res.status(500).json({ success: false, message: "Failed to load customers" });
    }
};

const addCustomer = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { business_location_id, name, mobile_number, address } = req.body;
        const locationId = req.user.business_location_id || business_location_id;
        const errors = {};

        if (!locationId) errors.business_location_id = "Business location is required";
        if (req.user.business_location_id && business_location_id &&
            String(business_location_id) !== String(req.user.business_location_id)) {
            errors.business_location_id = "You can only use your assigned business location";
        }
        if (!name || !name.trim()) errors.name = "Customer name is required";
        if (!mobile_number || !String(mobile_number).trim()) {
            errors.mobile_number = "Mobile number is required";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        const customer = await createCustomer({
            clientId,
            locationId,
            name: name.trim(),
            mobileNumber: String(mobile_number).trim(),
            address: address ? address.trim() : null,
        });

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Selected business location does not belong to this client",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error) {
        console.error("Create customer error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A customer with this mobile number already exists at this location",
            });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { addCustomer, listCustomers };