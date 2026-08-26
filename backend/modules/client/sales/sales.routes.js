const express = require("express");
const auth = require("../../../middleware/authMiddleware");
const { addSale, getSales, getSale, removeSale } = require("./sales.controller");

const router = express.Router();

router.use(auth);
router.post("/", addSale);
router.get("/", getSales);
router.get("/:id", getSale);
router.delete("/:id", removeSale);

module.exports = router;