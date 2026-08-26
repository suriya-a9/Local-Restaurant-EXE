const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const upload = require("../../../middleware/fileUpload");
const auth = require("../../../middleware/authMiddleware");

const {
    addProduct,
    editProduct,
    listProducts,
    getProduct,
} = require("./products.controller");

router.get("/", auth, listProducts);
router.get("/:id", auth, getProduct);
router.post("/", upload.single("image"), auth, addProduct);
router.post("/:id", upload.single("image"), auth, editProduct);

module.exports = router;