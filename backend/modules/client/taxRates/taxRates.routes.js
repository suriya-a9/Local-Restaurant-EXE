// taxRates.routes.js
const express = require("express");
const router = express.Router();

const { addTaxRate, listTaxRates } = require("./taxRates.controller");
const auth = require("../../../middleware/authMiddleware");

router.get("/", auth, listTaxRates);
router.post("/", auth, addTaxRate);

module.exports = router;