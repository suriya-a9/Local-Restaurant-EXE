const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    createAdmin,
    findAdminByEmail,
} = require("./adminAuth.model");

const adminRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        const existingAdmin = await findAdminByEmail(email);

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "Admin with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await createAdmin(
            name,
            email,
            hashedPassword
        );

        return res.status(201).json({
            success: true,
            message: "Super admin created successfully",
            data: admin,
        });

    } catch (error) {
        console.error("Admin register error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const admin = await findAdminByEmail(email);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: "super_admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    adminRegister,
    adminLogin,
};