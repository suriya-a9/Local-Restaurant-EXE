const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../middleware/authMiddleware");

const {
    addSubCategory,
    listSubCategories,
    editSubCategory,
    removeSubCategory,
} = require("./subCategories.controller");

router.use(authMiddleware);

router.post("/", addSubCategory);
router.get("/", listSubCategories);
router.put("/:id", editSubCategory);
router.delete("/:id", removeSubCategory);

module.exports = router;