const router = require("express").Router();
const multilingualController = require("../controller/multilingualController");

router.get("/tenantmultilingual/:tenantid", multilingualController.getTenantSpecificLanguages);
router.get("/multilingual/:languageid", multilingualController.getSelectedLanguage);

module.exports = router;