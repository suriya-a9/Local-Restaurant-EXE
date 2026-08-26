const express = require("express");
const router = express.Router();

const {
    addFeature,
    listFeatures,
    getFeature,
    editFeature,
    removeFeature,
} = require("./features.controller");

router.post("/", addFeature);
router.get("/", listFeatures);
router.get("/:id", getFeature);
router.put("/:id", editFeature);
router.delete("/:id", removeFeature);

module.exports = router;