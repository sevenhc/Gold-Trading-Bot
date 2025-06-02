const router = require("express").Router();
// const multer = require("multer");
const redisController = require("../controller/redisController");
const { verifyToken } = require("../utils/client-jwt-token");
const { sanitizebody } = require("../utils/req-validator");

router.get("/flushredis", redisController.FlushRedisCache);
router.get("/flushnode", redisController.FlushNodeCache);


module.exports = router;
