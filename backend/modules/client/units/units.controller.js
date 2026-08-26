const {
    createUnit,
    findUnitConflict,
    findUnitConflictExcludingId,
    findUnitById,
    getUnitsByClient,
    updateUnit,
    deleteUnit,
} = require("./units.model");

function conflictErrors(conflict, name, short_name) {
    const errors = {};

    if (conflict.name === name) {
        errors.name = "Name already in use";
    }

    if (conflict.short_name === short_name) {
        errors.short_name = "Short name already in use";
    }

    return errors;
}

const addUnit = async (req, res) => {
    try {
        const client_id = req.user.id;

        const { name, short_name, allow_decimal } = req.body;

        const errors = {};

        if (!name || !name.trim()) errors.name = "Name is required";
        if (!short_name || !short_name.trim()) errors.short_name = "Short name is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const trimmedName = name.trim();
        const trimmedShortName = short_name.trim();

        const conflict = await findUnitConflict(client_id, trimmedName, trimmedShortName);

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "A unit with this name or short name already exists",
                errors: conflictErrors(conflict, trimmedName, trimmedShortName),
            });
        }

        const unit = await createUnit({
            client_id,
            name: trimmedName,
            short_name: trimmedShortName,
            allow_decimal,
        });

        return res.status(201).json({
            success: true,
            message: "Unit created successfully",
            data: unit,
        });

    } catch (error) {
        console.error("Create unit error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const listUnits = async (req, res) => {
    try {
        const client_id = req.user.id;

        const units = await getUnitsByClient(client_id);

        return res.status(200).json({
            success: true,
            data: units,
        });

    } catch (error) {
        console.error("List units error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const editUnit = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findUnitById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }

        const { name, short_name, allow_decimal } = req.body;

        const errors = {};

        if (!name || !name.trim()) errors.name = "Name is required";
        if (!short_name || !short_name.trim()) errors.short_name = "Short name is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const trimmedName = name.trim();
        const trimmedShortName = short_name.trim();

        const conflict = await findUnitConflictExcludingId(
            client_id,
            trimmedName,
            trimmedShortName,
            id
        );

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "A unit with this name or short name already exists",
                errors: conflictErrors(conflict, trimmedName, trimmedShortName),
            });
        }

        const unit = await updateUnit(id, {
            name: trimmedName,
            short_name: trimmedShortName,
            allow_decimal,
        });

        return res.status(200).json({
            success: true,
            message: "Unit updated successfully",
            data: unit,
        });

    } catch (error) {
        console.error("Update unit error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeUnit = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findUnitById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Unit not found",
            });
        }

        await deleteUnit(id);

        return res.status(200).json({
            success: true,
            message: "Unit deleted successfully",
        });

    } catch (error) {
        console.error("Delete unit error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    addUnit,
    listUnits,
    editUnit,
    removeUnit,
};