const express = require("express");
const router = express.Router();

const requireClientAuth = require("../../../middleware/authMiddleware");

const {
    addBusinessLocation,
    listBusinessLocations,
    editBusinessLocation,
    removeBusinessLocation,
} = require("./businessLocations.controller");

router.use(requireClientAuth);

router.post("/", addBusinessLocation);
router.get("/", listBusinessLocations);
router.put("/:id", editBusinessLocation);
router.delete("/:id", removeBusinessLocation);

module.exports = router;