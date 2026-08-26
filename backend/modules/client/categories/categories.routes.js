const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../middleware/authMiddleware");

const {
    addCategory,
    listCategories,
    editCategory,
    removeCategory,
} = require("./categories.controller");

router.use(authMiddleware);

router.post("/", addCategory);
router.get("/", listCategories);
router.put("/:id", editCategory);
router.delete("/:id", removeCategory);

module.exports = router;