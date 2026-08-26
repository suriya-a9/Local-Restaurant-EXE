const express = require("express");
const router = express.Router();

const {
    addClient,
    listClients,
    getClient,
    changeStatus,
} = require("./clients.controller");

const {
    assignPlan,
    currentSubscription,
    subscriptionHistory,
} = require("../clientSubscriptions/clientSubscriptions.controller");

router.post("/", addClient);
router.get("/", listClients);
router.get("/:id", getClient);
router.post("/:id/change-status", changeStatus);

router.post("/:id/assign-plan", assignPlan);
router.get("/:id/current-subscription", currentSubscription);
router.get("/:id/subscription-history", subscriptionHistory);

module.exports = router;