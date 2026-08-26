const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../middleware/authMiddleware");

const {
    addEmployee,
    listEmployees,
    getEmployee,
    editEmployee,
    removeEmployee,
} = require("./employees.controller");

router.use(authMiddleware);

router.post("/", addEmployee);
router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.put("/:id", editEmployee);
router.delete("/:id", removeEmployee);

module.exports = router;