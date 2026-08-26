const {
    createProduct,
    updateProduct,
    setProductLocations,
    getAllProducts,
    findProductById,
} = require("./products.model");

const parseLocationIds = (body) => {
    const raw = body["business_location_ids[]"] || body.business_location_ids;

    if (!raw) return [];

    return Array.isArray(raw) ? raw : [raw];
};

const buildProductPayload = (body, file) => ({
    name: body.name,
    barcode: body.barcode,
    shortcut_number: body.shortcut_number ? Number(body.shortcut_number) : null,
    image: file ? `/uploads/${file.filename}` : null,
    unit_id: body.unit_id || null,
    category_id: body.category_id || null,
    sub_category_id: body.sub_category_id || null,
    applicable_tax_id: body.applicable_tax_id || null,
    product_type: "single",
    selling_price_tax_type: body.selling_price_tax_type || "exclusive",
    enable_stock: body.enable_stock === "1" || body.enable_stock === true,
    alert_quantity: body.alert_quantity ? Number(body.alert_quantity) : null,
    margin_percent: Number(body.margin_percent) || 0,
    default_purchase_price_exc_tax: Number(body.default_purchase_price_exc_tax) || 0,
    default_purchase_price_inc_tax: Number(body.default_purchase_price_inc_tax) || 0,
    default_selling_price_exc_tax: Number(body.default_selling_price_exc_tax),
    default_selling_price_inc_tax: Number(body.default_selling_price_inc_tax),
});

const addProduct = async (req, res) => {
    try {
        const clientId = req.user.id; // adjust to match your client auth middleware

        if (!req.body.name || !req.body.name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        if (
            req.body.default_selling_price_exc_tax === undefined ||
            req.body.default_selling_price_inc_tax === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Selling price is required",
            });
        }

        const payload = buildProductPayload(req.body, req.file);

        const product = await createProduct(clientId, payload);

        const locationIds = req.user.business_location_id
            ? [req.user.business_location_id]
            : parseLocationIds(req.body);
        await setProductLocations(product.id, locationIds);

        const fullProduct = await findProductById(
            product.id,
            clientId,
            req.user.business_location_id
        );

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: fullProduct,
        });

    } catch (error) {
        console.error("Create product error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "SKU already exists for this client",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editProduct = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const existing = await findProductById(
            id,
            clientId,
            req.user.business_location_id
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const payload = buildProductPayload(req.body, req.file);

        await updateProduct(id, clientId, payload);

        const locationIds = req.user.business_location_id
            ? [req.user.business_location_id]
            : parseLocationIds(req.body);
        await setProductLocations(id, locationIds);

        const fullProduct = await findProductById(
            id,
            clientId,
            req.user.business_location_id
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: fullProduct,
        });

    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const listProducts = async (req, res) => {
    try {
        const clientId = req.user.id;

        const { search, page = 1, per_page = 10 } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(per_page, 10) || 10, 1), 1000);

        const { rows, total } = await getAllProducts(clientId, {
            search,
            page: pageNum,
            limit: limitNum,
            locationId: req.user.business_location_id || req.query.business_location_id,
        });

        return res.status(200).json({
            success: true,
            data: {
                data: rows,
                current_page: pageNum,
                per_page: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        });

    } catch (error) {
        console.error("List products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const getProduct = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const product = await findProductById(
            id,
            clientId,
            req.user.business_location_id
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: product,
        });

    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    addProduct,
    editProduct,
    listProducts,
    getProduct,
};