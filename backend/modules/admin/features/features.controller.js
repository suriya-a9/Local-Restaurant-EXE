const {
    createFeature,
    getAllFeatures,
    findFeatureById,
    updateFeature,
    deleteFeature,
} = require("./features.model");

const addFeature = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        const feature = await createFeature(name.trim());

        return res.status(201).json({
            success: true,
            message: "Feature created successfully",
            data: feature,
        });

    } catch (error) {
        console.error("Create feature error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listFeatures = async (req, res) => {
    try {
        const features = await getAllFeatures();

        return res.status(200).json({
            success: true,
            data: features,
        });

    } catch (error) {
        console.error("List features error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const getFeature = async (req, res) => {
    try {
        const { id } = req.params;

        const feature = await findFeatureById(id);

        if (!feature) {
            return res.status(404).json({
                success: false,
                message: "Feature not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: feature,
        });

    } catch (error) {
        console.error("Get feature error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        const existingFeature = await findFeatureById(id);

        if (!existingFeature) {
            return res.status(404).json({
                success: false,
                message: "Feature not found",
            });
        }

        const feature = await updateFeature(id, name.trim());

        return res.status(200).json({
            success: true,
            message: "Feature updated successfully",
            data: feature,
        });

    } catch (error) {
        console.error("Update feature error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const removeFeature = async (req, res) => {
    try {
        const { id } = req.params;

        const existingFeature = await findFeatureById(id);

        if (!existingFeature) {
            return res.status(404).json({
                success: false,
                message: "Feature not found",
            });
        }

        const feature = await deleteFeature(id);

        return res.status(200).json({
            success: true,
            message: "Feature deleted successfully",
            data: feature,
        });

    } catch (error) {
        console.error("Delete feature error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    addFeature,
    listFeatures,
    getFeature,
    editFeature,
    removeFeature,
};