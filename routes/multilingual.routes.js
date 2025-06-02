const router = require("express").Router();
const multilingualController = require("../controller/multilingualController");

router.get("/multilingualgetbyid/:languageid", multilingualController.getSelectedLanguage);
router.get("/multilingualgetall", multilingualController.getAllLanguages);
router.put("/languagecontentupdate", multilingualController.updateLanguageContent);

module.exports = router;