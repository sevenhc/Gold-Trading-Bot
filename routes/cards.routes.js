const router = require("express").Router();
const { verifyToken } = require("../utils/client-jwt-token");
const cardEnrollingController = require("../controller/cardEnrollingController");

router.post("/cardcreate", verifyToken, cardEnrollingController.CreateClientCard);
router.delete("/carddelete", verifyToken, cardEnrollingController.DeleteClientCard);
router.get("/cardgetall", verifyToken, cardEnrollingController.GetAllClientCards);
router.put("/cardsetdefault", verifyToken, cardEnrollingController.CardSetDefault);
router.put("/unenrollclient", verifyToken, cardEnrollingController.UnenrollClient);
router.get("/enrolleevisaparams", verifyToken, cardEnrollingController.VisaParametersForCardEnrolling);
router.post("/getvisacarduser", verifyToken, cardEnrollingController.GetVisaCardUser);

router.put("/emailsubscription", verifyToken, cardEnrollingController.EmailSubscription);
router.post("/emailgetsubscription", verifyToken, cardEnrollingController.EmailGetSubscription);
router.put("/emailunsubscription", cardEnrollingController.EmailUnsubscribe);
router.put("/setalias", verifyToken, cardEnrollingController.SetAlias);

module.exports = router;