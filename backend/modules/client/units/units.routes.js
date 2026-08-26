const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../middleware/authMiddleware");

const {
    addUnit,
    listUnits,
    editUnit,
    removeUnit,
} = require("./units.controller");

router.use(authMiddleware);

router.post("/", addUnit);
router.get("/", listUnits);
router.put("/:id", editUnit);
router.delete("/:id", removeUnit);

module.exports = router;