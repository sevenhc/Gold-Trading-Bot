const router = require("express").Router();
const analyticsController = require("../controller/analyticsController");

router.post("/", analyticsController.analytics);

module.exports = router;