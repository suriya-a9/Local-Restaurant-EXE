const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { findClientByName } = require("../../admin/clients/clients.model");
const { findEmployeeLoginByName } = require("../employees/employees.model");
const {
    hasActiveSubscription,
    getCurrentSubscription,
} = require("../../admin/clientSubscriptions/clientSubscriptions.model");

const login = async (req, res) => {
    try {
        const { name, password } = req.body;

        const errors = {};

        if (!name || !name.trim()) {
            errors.name = "Name is required";
        }

        if (!password) {
            errors.password = "Password is required";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const normalizedName = name.trim();
        const client = await findClientByName(normalizedName);

        if (!client) {
            const employee = await findEmployeeLoginByName(normalizedName);

            if (!employee || !(await bcrypt.compare(password, employee.password))) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid name or password",
                });
            }

            if (employee.client_status === "suspended" || employee.client_status === "inactive") {
                return res.status(403).json({
                    success: false,
                    message: `Your account is ${employee.client_status}. Please contact support.`,
                });
            }

            if (!(await hasActiveSubscription(employee.client_id))) {
                return res.status(403).json({
                    success: false,
                    message: "Your subscription has expired. Please contact support to renew your plan.",
                });
            }

            const subscription = await getCurrentSubscription(employee.client_id);

            const token = jwt.sign(
                {
                    id: employee.client_id,
                    employee_id: employee.id,
                    email: employee.email,
                    role: employee.role,
                    business_location_id: employee.business_location_id,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: {
                        id: employee.client_id,
                        employee_id: employee.id,
                        client_id: employee.client_id,
                        client_name: employee.client_name,
                        name: employee.name,
                        email: employee.email,
                        role: employee.role,
                        business_location_id: employee.business_location_id,
                        business_location: employee.business_location,
                        roles: [{ name: employee.role }],
                    },
                    subscription,
                    token,
                },
            });
        }

        if (!client) {
            return res.status(401).json({
                success: false,
                message: "Invalid name or password",
            });
        }

        if (client.status === "suspended" || client.status === "inactive") {
            return res.status(403).json({
                success: false,
                message: `Your account is ${client.status}. Please contact support.`,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, client.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid name or password",
            });
        }

        if (!(await hasActiveSubscription(client.id))) {
            return res.status(403).json({
                success: false,
                message: "Your subscription has expired. Please contact support to renew your plan.",
            });
        }

        const subscription = await getCurrentSubscription(client.id);

        const token = jwt.sign(
            { id: client.id, email: client.email, role: "client" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _password, ...clientData } = client;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                client: clientData,
                subscription,
                token,
            },
        });

    } catch (error) {
        console.error("Client login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    login,
};