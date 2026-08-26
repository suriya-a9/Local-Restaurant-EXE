const {
    createTable,
    getAllTables,
    findTableById,
    updateTable,
    updateTableStatus,
    deleteTable,
} = require("./tables.model");

const VALID_STATUSES = ["available", "occupied", "reserved"];

const addTable = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { business_location_id, name, capacity, status } = req.body;

        const errors = {};

        if (!business_location_id) errors.business_location_id = "Business location is required";
        if (!name || !name.trim()) errors.name = "Table name is required";

        if (status && !VALID_STATUSES.includes(status)) {
            errors.status = "Invalid status value";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const table = await createTable(clientId, {
            business_location_id,
            name: name.trim(),
            capacity: capacity ? Number(capacity) : null,
            status,
        });

        return res.status(201).json({
            success: true,
            message: "Table created successfully",
            data: table,
        });

    } catch (error) {
        console.error("Create table error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A table with this name already exists at this location",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listTables = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { business_location_id } = req.query;

        const tables = await getAllTables(clientId, business_location_id);

        return res.status(200).json({
            success: true,
            data: tables,
        });

    } catch (error) {
        console.error("List tables error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const getTable = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const table = await findTableById(id, clientId);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: table,
        });

    } catch (error) {
        console.error("Get table error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editTable = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;
        const { business_location_id, name, capacity } = req.body;

        if (!business_location_id || !name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "business_location_id and name are required",
            });
        }

        const existing = await findTableById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        const table = await updateTable(id, clientId, {
            business_location_id,
            name: name.trim(),
            capacity: capacity ? Number(capacity) : null,
        });

        return res.status(200).json({
            success: true,
            message: "Table updated successfully",
            data: table,
        });

    } catch (error) {
        console.error("Update table error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A table with this name already exists at this location",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const changeStatus = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const existing = await findTableById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        const table = await updateTableStatus(id, clientId, status);

        return res.status(200).json({
            success: true,
            message: "Table status updated successfully",
            data: table,
        });

    } catch (error) {
        console.error("Update table status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const removeTable = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const existing = await findTableById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        await deleteTable(id, clientId);

        return res.status(200).json({
            success: true,
            message: "Table deleted successfully",
        });

    } catch (error) {
        console.error("Delete table error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    addTable,
    listTables,
    getTable,
    editTable,
    changeStatus,
    removeTable,
};