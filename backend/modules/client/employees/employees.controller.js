const bcrypt = require("bcryptjs");

const {
    getAllRoles,
    findRoleByName,
    findLocationForClient,
    createEmployee,
    findEmployeeByEmail,
    findEmployeeByName,
    findEmployeeByEmailExcludingId,
    findEmployeeByNameExcludingId,
    findEmployeeById,
    getEmployeesByClient,
    updateEmployee,
    updateEmployeePassword,
    deleteEmployee,
} = require("./employees.model");

const listRoles = async (req, res) => {
    try {
        const roles = await getAllRoles();

        return res.status(200).json({
            success: true,
            data: roles,
        });

    } catch (error) {
        console.error("List roles error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

async function validateEmployeePayload(req) {
    const {
        name,
        email,
        phone,
        business_location_id,
        designation,
        date_of_joining,
        salary,
        role,
    } = req.body;

    const errors = {};

    if (!name || !name.trim()) errors.name = "Name is required";
    if (!email || !email.trim()) errors.email = "Email is required";
    if (!business_location_id) errors.business_location_id = "Business location is required";
    if (!role || !role.trim()) errors.role = "Role is required";

    if (salary !== undefined && salary !== "" && salary !== null && isNaN(Number(salary))) {
        errors.salary = "Salary must be a number";
    }

    return { errors, name, email, phone, business_location_id, designation, date_of_joining, salary, role };
}

const addEmployee = async (req, res) => {
    try {
        const client_id = req.user.id;

        const {
            errors,
            name,
            email,
            phone,
            business_location_id,
            designation,
            date_of_joining,
            salary,
            role,
        } = await validateEmployeePayload(req);

        const { password } = req.body;

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

        const location = await findLocationForClient(business_location_id, client_id);

        if (!location) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { business_location_id: "Selected location does not exist" },
            });
        }

        const roleRow = await findRoleByName(role);

        if (!roleRow) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { role: "Selected role does not exist" },
            });
        }

        const existing = await findEmployeeByEmail(client_id, email.trim());

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An employee with this email already exists",
                errors: { email: "Email already in use" },
            });
        }

        const existingName = await findEmployeeByName(client_id, name.trim());
        if (existingName) {
            return res.status(409).json({
                success: false,
                message: "An employee with this name already exists",
                errors: { name: "Name already in use" },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const employee = await createEmployee({
            client_id,
            business_location_id,
            role_id: roleRow.id,
            name: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            phone: phone ? phone.trim() : null,
            designation: designation ? designation.trim() : null,
            date_of_joining: date_of_joining || null,
            salary: salary === "" ? null : salary,
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: {
                ...employee,
                business_location: { id: location.id, name: location.name, code: location.code },
                role: { id: roleRow.id, name: roleRow.name },
            },
        });

    } catch (error) {
        console.error("Create employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const listEmployees = async (req, res) => {
    try {
        const client_id = req.user.id;

        const employees = await getEmployeesByClient(client_id);

        return res.status(200).json({
            success: true,
            data: employees,
        });

    } catch (error) {
        console.error("List employees error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getEmployee = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const employee = await findEmployeeById(id, client_id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: employee,
        });

    } catch (error) {
        console.error("Get employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const editEmployee = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findEmployeeById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        const {
            errors,
            name,
            email,
            phone,
            business_location_id,
            designation,
            date_of_joining,
            salary,
            role,
        } = await validateEmployeePayload(req);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const location = await findLocationForClient(business_location_id, client_id);

        if (!location) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { business_location_id: "Selected location does not exist" },
            });
        }

        const roleRow = await findRoleByName(role);

        if (!roleRow) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { role: "Selected role does not exist" },
            });
        }

        const emailConflict = await findEmployeeByEmailExcludingId(client_id, email.trim(), id);

        if (emailConflict) {
            return res.status(409).json({
                success: false,
                message: "An employee with this email already exists",
                errors: { email: "Email already in use" },
            });
        }

        const nameConflict = await findEmployeeByNameExcludingId(client_id, name.trim(), id);
        if (nameConflict) {
            return res.status(409).json({
                success: false,
                message: "An employee with this name already exists",
                errors: { name: "Name already in use" },
            });
        }

        const employee = await updateEmployee(id, {
            business_location_id,
            role_id: roleRow.id,
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            designation: designation ? designation.trim() : null,
            date_of_joining: date_of_joining || null,
            salary: salary === "" ? null : salary,
        });

        const { password } = req.body;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await updateEmployeePassword(id, hashedPassword);
        }

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: {
                ...employee,
                business_location: { id: location.id, name: location.name, code: location.code },
                role: { id: roleRow.id, name: roleRow.name },
            },
        });

    } catch (error) {
        console.error("Update employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeEmployee = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findEmployeeById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        await deleteEmployee(id);

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
        });

    } catch (error) {
        console.error("Delete employee error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    listRoles,
    addEmployee,
    listEmployees,
    getEmployee,
    editEmployee,
    removeEmployee,
};