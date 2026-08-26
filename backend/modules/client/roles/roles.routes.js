const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../middleware/authMiddleware");
const { listRoles } = require("../employees/employees.controller");

router.use(authMiddleware);

router.get("/", listRoles);

module.exports = router;