const router = require("express").Router();
const rewardsController = require("../controller/rewardsController");
const { verifyToken } = require("../utils/client-jwt-token");

router.get("/rewardinfo", verifyToken, rewardsController.getRewardInfo);
// router.get("/rewardvalues", rewardsController.getRewardValues);
// router.get("/referal_reward_values", rewardsController.getRefereeRewardDetails);
// router.get("/referer_reward_amount", rewardsController.getRefererRewardAmount);

module.exports = router;
