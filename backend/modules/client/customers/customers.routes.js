const express = require("express");
const authMiddleware = require("../../../middleware/authMiddleware");
const { addCustomer, listCustomers } = require("./customers.controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/", listCustomers);
router.post("/", addCustomer);

module.exports = router;