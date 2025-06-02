const router = require("express").Router();

const commonController = require("../controller/commonController");
const { verifyToken } = require("../utils/client-jwt-token");

router.get("/fetch-image", commonController.fetchImage);
router.get("/get-aws-params", commonController.getAwsParams);


module.exports = router;