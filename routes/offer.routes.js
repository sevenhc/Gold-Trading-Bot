const router = require("express").Router();
// const multer = require("multer");
const offerController = require("../controller/offerController");
const { verifyToken } = require("../utils/client-jwt-token");
const { sanitizebody } = require("../utils/req-validator");

router.get("/", offerController.OffersGetAll);
router.get("/lite", offerController.OffersGetLite);
router.get("/offerbyid", offerController.OfferGetByID);
router.get("/getsimilaroffers", offerController.PersonaliseGetSimilarOffers);
router.get("/getuserpersonaliseoffers", offerController.GetUserPersonaliseOffers);
router.get("/getpopularoffercount", offerController.GetPopularCountOffers);
router.get("/getofferlocations", offerController.GetOfferLocations);

router.post(
  "/offerpostattribution",
  verifyToken,
  sanitizebody("tenantid", "externaluserid", "offerid", "action"),
  offerController.PostOfferAttribution
);

router.get("/offergetattributes", offerController.GetOfferAttribution);

router.post(
  "/personalisationPutEventsAPI",
  offerController.personalisationPutEventsAPI
);

module.exports = router;
