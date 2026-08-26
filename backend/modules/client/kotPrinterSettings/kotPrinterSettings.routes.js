const express = require("express");
const router = express.Router();

const {
    getSettings,
    addSettings,
    editSettings,
    addStation,
    editStation,
    removeStation,
} = require("./kotPrinterSettings.controller");

const auth = require("../../../middleware/authMiddleware");

router.get("/", auth, getSettings);
router.post("/", auth, addSettings);
router.put("/:id", auth, editSettings);

router.post("/station", auth, addStation);
router.put("/station/:id", auth, editStation);
router.delete("/station/:id", auth, removeStation);

module.exports = router;