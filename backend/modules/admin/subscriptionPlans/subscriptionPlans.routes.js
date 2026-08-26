const express = require("express");
const router = express.Router();

const {
    addPlan,
    listPlans,
    getPlan,
    editPlan,
    removePlan,
} = require("./subscriptionPlans.controller");

router.post("/", addPlan);
router.get("/", listPlans);
router.get("/:id", getPlan);
router.put("/:id", editPlan);
router.delete("/:id", removePlan);

module.exports = router;