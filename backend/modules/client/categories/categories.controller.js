const {
    createCategory,
    findCategoryByName,
    findCategoryByNameExcludingId,
    findCategoryById,
    getCategoriesByClient,
    updateCategory,
    deleteCategory,
} = require("./categories.model");

const addCategory = async (req, res) => {
    try {
        const client_id = req.user.id;

        const { name, description } = req.body;

        const errors = {};

        if (!name || !name.trim()) {
            errors.name = "Name is required";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const existing = await findCategoryByName(client_id, name.trim());

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
                errors: { name: "Name already in use" },
            });
        }

        const category = await createCategory({
            client_id,
            name: name.trim(),
            description: description ? description.trim() : null,
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });

    } catch (error) {
        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const listCategories = async (req, res) => {
    try {
        const client_id = req.user.id;

        const categories = await getCategoriesByClient(client_id);

        return res.status(200).json({
            success: true,
            data: categories,
        });

    } catch (error) {
        console.error("List categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const editCategory = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findCategoryById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const { name, description } = req.body;

        const errors = {};

        if (!name || !name.trim()) {
            errors.name = "Name is required";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const nameConflict = await findCategoryByNameExcludingId(
            client_id,
            name.trim(),
            id
        );

        if (nameConflict) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
                errors: { name: "Name already in use" },
            });
        }

        const category = await updateCategory(id, {
            name: name.trim(),
            description: description ? description.trim() : null,
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });

    } catch (error) {
        console.error("Update category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeCategory = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findCategoryById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        await deleteCategory(id);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });

    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    addCategory,
    listCategories,
    editCategory,
    removeCategory,
};