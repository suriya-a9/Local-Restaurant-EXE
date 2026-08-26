const router = require("express").Router();
const authMiddleware = require("../../../middleware/authMiddleware");
const { pushSnapshot } = require("./sync.controller");
router.post("/push", authMiddleware, pushSnapshot);
module.exports = router;
