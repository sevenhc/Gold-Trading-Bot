const router = require("express").Router();

const gamificationController = require("../controller/gamificationController");
const { verifyToken } = require("../utils/client-jwt-token");
const { sanitizebody } = require("../utils/req-validator");

router.post("/pick-reward", verifyToken, gamificationController.PickRewards);
router.post("/reward-issue", verifyToken, gamificationController.RewardIssue);
router.get("/get-campaigns", verifyToken, gamificationController.getCampaigns);
router.get("/get-campaign-reward-options", verifyToken, gamificationController.getCampaignRewardOptions);
router.post("/get-reward", verifyToken, gamificationController.getRewardDetails);
router.get("/get-rewards", verifyToken, gamificationController.getRewards);
router.post("/get-wining-reward-details", gamificationController.getWinningRewardDetails);
router.post("/add-social-share-details", gamificationController.SaveSocialShareDetails);

module.exports = router;
