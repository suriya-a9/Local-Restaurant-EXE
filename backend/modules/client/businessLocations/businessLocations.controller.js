const {
    createBusinessLocation,
    findLocationByCode,
    findLocationByCodeExcludingId,
    findLocationById,
    getLocationsByClient,
    unsetPrimaryForClient,
    updateBusinessLocation,
    deleteBusinessLocation,
} = require("./businessLocations.model");

const addBusinessLocation = async (req, res) => {
    try {
        const client_id = req.user.id;

        const {
            name,
            code,
            gst_number,
            address,
            city,
            state,
            country,
            postal_code,
            phone,
            email,
            is_primary,
        } = req.body;

        const errors = {};

        if (!name || !name.trim()) errors.name = "Location name is required";
        if (!code || !code.trim()) errors.code = "Location code is required";
        if (!address || !address.trim()) errors.address = "Address is required";
        if (!city || !city.trim()) errors.city = "City is required";
        if (!state || !state.trim()) errors.state = "State is required";
        if (!country || !country.trim()) errors.country = "Country is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const existing = await findLocationByCode(client_id, code.trim());

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A location with this code already exists",
                errors: { code: "Code already in use" },
            });
        }

        if (is_primary) {
            await unsetPrimaryForClient(client_id);
        }

        const location = await createBusinessLocation({
            client_id,
            name: name.trim(),
            code: code.trim(),
            gst_number: gst_number ? gst_number.trim() : null,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            postal_code: postal_code ? postal_code.trim() : null,
            phone: phone ? phone.trim() : null,
            email: email ? email.trim() : null,
            is_primary: !!is_primary,
        });

        return res.status(201).json({
            success: true,
            message: "Business location created successfully",
            data: location,
        });

    } catch (error) {
        console.error("Create business location error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const listBusinessLocations = async (req, res) => {
    try {
        const client_id = req.user.id;

        const locations = req.user.business_location_id
            ? await findLocationById(req.user.business_location_id, client_id).then((location) =>
                location ? [location] : []
            )
            : await getLocationsByClient(client_id);

        return res.status(200).json({
            success: true,
            data: locations,
        });

    } catch (error) {
        console.error("List business locations error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const editBusinessLocation = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findLocationById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Business location not found",
            });
        }

        const {
            name,
            code,
            gst_number,
            address,
            city,
            state,
            country,
            postal_code,
            phone,
            email,
            is_primary,
        } = req.body;

        const errors = {};

        if (!name || !name.trim()) errors.name = "Location name is required";
        if (!code || !code.trim()) errors.code = "Location code is required";
        if (!address || !address.trim()) errors.address = "Address is required";
        if (!city || !city.trim()) errors.city = "City is required";
        if (!state || !state.trim()) errors.state = "State is required";
        if (!country || !country.trim()) errors.country = "Country is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const codeConflict = await findLocationByCodeExcludingId(
            client_id,
            code.trim(),
            id
        );

        if (codeConflict) {
            return res.status(409).json({
                success: false,
                message: "A location with this code already exists",
                errors: { code: "Code already in use" },
            });
        }

        if (is_primary && !existing.is_primary) {
            await unsetPrimaryForClient(client_id);
        }

        const location = await updateBusinessLocation(id, {
            name: name.trim(),
            code: code.trim(),
            gst_number: gst_number ? gst_number.trim() : null,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            postal_code: postal_code ? postal_code.trim() : null,
            phone: phone ? phone.trim() : null,
            email: email ? email.trim() : null,
            is_primary: !!is_primary,
        });

        return res.status(200).json({
            success: true,
            message: "Business location updated successfully",
            data: location,
        });

    } catch (error) {
        console.error("Update business location error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeBusinessLocation = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findLocationById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Business location not found",
            });
        }

        await deleteBusinessLocation(id);

        return res.status(200).json({
            success: true,
            message: "Business location deleted successfully",
        });

    } catch (error) {
        console.error("Delete business location error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    addBusinessLocation,
    listBusinessLocations,
    editBusinessLocation,
    removeBusinessLocation,
};