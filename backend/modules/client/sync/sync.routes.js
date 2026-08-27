const router = require("express").Router();
const authMiddleware = require("../../../middleware/authMiddleware");
const { pushSnapshot, pullSnapshot } = require("./sync.controller");

router.post("/push", authMiddleware, pushSnapshot);
router.get("/pull", authMiddleware, pullSnapshot);

module.exports = router;