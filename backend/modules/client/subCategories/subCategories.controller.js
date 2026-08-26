const {
    createSubCategory,
    findCategoryForClient,
    findSubCategoryByName,
    findSubCategoryByNameExcludingId,
    findSubCategoryById,
    getSubCategoriesByClient,
    updateSubCategory,
    deleteSubCategory,
} = require("./subCategories.model");

const addSubCategory = async (req, res) => {
    try {
        const client_id = req.user.id;

        const { category_id, name } = req.body;

        const errors = {};

        if (!category_id) {
            errors.category_id = "Category is required";
        }

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

        const category = await findCategoryForClient(category_id, client_id);

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { category_id: "Selected category does not exist" },
            });
        }

        const existing = await findSubCategoryByName(category_id, name.trim());

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A sub category with this name already exists in this category",
                errors: { name: "Name already in use" },
            });
        }

        const subCategory = await createSubCategory({
            client_id,
            category_id,
            name: name.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Sub category created successfully",
            data: { ...subCategory, category: { id: category.id, name: category.name } },
        });

    } catch (error) {
        console.error("Create sub category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const listSubCategories = async (req, res) => {
    try {
        const client_id = req.user.id;

        const subCategories = await getSubCategoriesByClient(client_id);

        return res.status(200).json({
            success: true,
            data: subCategories,
        });

    } catch (error) {
        console.error("List sub categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const editSubCategory = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findSubCategoryById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Sub category not found",
            });
        }

        const { category_id, name } = req.body;

        const errors = {};

        if (!category_id) {
            errors.category_id = "Category is required";
        }

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

        const category = await findCategoryForClient(category_id, client_id);

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: { category_id: "Selected category does not exist" },
            });
        }

        const nameConflict = await findSubCategoryByNameExcludingId(
            category_id,
            name.trim(),
            id
        );

        if (nameConflict) {
            return res.status(409).json({
                success: false,
                message: "A sub category with this name already exists in this category",
                errors: { name: "Name already in use" },
            });
        }

        const subCategory = await updateSubCategory(id, {
            category_id,
            name: name.trim(),
        });

        return res.status(200).json({
            success: true,
            message: "Sub category updated successfully",
            data: { ...subCategory, category: { id: category.id, name: category.name } },
        });

    } catch (error) {
        console.error("Update sub category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const removeSubCategory = async (req, res) => {
    try {
        const client_id = req.user.id;
        const { id } = req.params;

        const existing = await findSubCategoryById(id, client_id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Sub category not found",
            });
        }

        await deleteSubCategory(id);

        return res.status(200).json({
            success: true,
            message: "Sub category deleted successfully",
        });

    } catch (error) {
        console.error("Delete sub category error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    addSubCategory,
    listSubCategories,
    editSubCategory,
    removeSubCategory,
};