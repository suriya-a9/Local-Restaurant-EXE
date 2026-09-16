const express = require("express");
const auth = require("../../../middleware/authMiddleware");
const { addSale, getSales, getSale, removeSale } = require("./sales.controller");
const cash = require("./cashSession.controller");

const router = express.Router();

router.use(auth);
router.get("/cash-session/today", cash.today);
router.post("/cash-session/open", cash.open);
router.get("/cash-session/report", cash.report);
router.post("/cash-session/close", cash.close);
router.post("/", addSale);
router.get("/", getSales);
router.get("/:id", getSale);
router.delete("/:id", removeSale);

module.exports = router;