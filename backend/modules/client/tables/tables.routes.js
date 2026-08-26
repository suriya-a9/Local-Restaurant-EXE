const express = require("express");
const router = express.Router();

const {
    addTable,
    listTables,
    getTable,
    editTable,
    changeStatus,
    removeTable,
} = require("./tables.controller");

const auth = require("../../../middleware/authMiddleware");

router.post("/", auth, addTable);
router.get("/", auth, listTables);
router.get("/:id", auth, getTable);
router.put("/:id", auth, editTable);
router.post("/:id/change-status", auth, changeStatus);
router.delete("/:id", auth, removeTable);

module.exports = router;