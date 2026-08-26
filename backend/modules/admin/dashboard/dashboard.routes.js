const express = require("express");
const router = express.Router();

const {
    getStats,
    listDashboardClients,
} = require("./dashboard.controller");

router.get("/stats", getStats);
router.get("/clients", listDashboardClients);

module.exports = router;