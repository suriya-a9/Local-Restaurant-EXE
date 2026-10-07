const bcrypt = require("bcryptjs");

const {
    createClient,
    findClientByName,
    findClientById,
    getAllClients,
    updateClientStatus,
    updateClientPassword,
    deleteClientById,
} = require("./clients.model");

const VALID_STATUSES = ["trial", "active", "inactive", "suspended"];

const addClient = async (req, res) => {
    try {
        const {
            business_name,
            name,
            email,
            password,
            password_confirmation,
            phone,
        } = req.body;

        const errors = {};

        if (!business_name || !business_name.trim()) {
            errors.business_name = "Business name is required";
        }

        if (!name || !name.trim()) {
            errors.name = "Username is required";
        } else if (/\s/.test(name)) {
            errors.name = "Username cannot contain spaces";
        }

        if (!email || !email.trim()) {
            errors.email = "Email is required";
        }

        if (!password) {
            errors.password = "Password is required";
        }

        if (password !== password_confirmation) {
            errors.password_confirmation = "Passwords do not match";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const existingClient = await findClientByName(name.trim());

        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: "A client with this username already exists",
                errors: { name: "Username already in use" },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const client = await createClient({
            business_name: business_name.trim(),
            name: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            phone: phone ? phone.trim() : null,
        });

        return res.status(201).json({
            success: true,
            message: "Client created successfully",
            data: client,
        });

    } catch (error) {
        console.error("Create client error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listClients = async (req, res) => {
    try {
        const clients = await getAllClients();

        return res.status(200).json({
            success: true,
            data: clients,
        });

    } catch (error) {
        console.error("List clients error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const getClient = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await findClientById(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: client,
        });

    } catch (error) {
        console.error("Get client error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const existingClient = await findClientById(id);

        if (!existingClient) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const client = await updateClientStatus(id, status);

        return res.status(200).json({
            success: true,
            message: "Client status updated successfully",
            data: client,
        });

    } catch (error) {
        console.error("Change client status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, password_confirmation } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }
        if (password !== password_confirmation) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }
        if (!(await findClientById(id))) {
            return res.status(404).json({ success: false, message: "Client not found" });
        }
        await updateClientPassword(id, await bcrypt.hash(password, 10));
        return res.status(200).json({ success: true, message: "Client password updated successfully" });
    } catch (error) {
        console.error("Change client password error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteClient = async (req, res) => {
    try {
        const deleted = await deleteClientById(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Client not found" });
        return res.status(200).json({ success: true, message: "Client deleted successfully", data: deleted });
    } catch (error) {
        console.error("Delete client error:", error);
        return res.status(500).json({ success: false, message: "Unable to delete client. Check related records and try again." });
    }
};

module.exports = {
    addClient,
    listClients,
    getClient,
    changeStatus,
    changePassword,
    deleteClient,
};