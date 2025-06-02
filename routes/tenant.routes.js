const router = require("express").Router();
const tenantController = require("../controller/tenantController");
const multilingualController = require("../controller/multilingualController")
const { verifyToken } = require("../utils/jwt-token");
const { multerupload } = require("../utils/multer");
const { sanitizeparams, sanitizebody, sanitizeform } = require("../utils/req-validator");


router.post("/tenantcreate", multerupload.fields([
    { name: "tenantlogo" },
    { name: "tenantbannerimage" }
]), sanitizebody("tenantname","tenanturlname"), tenantController.TenantCreate);

router.post("/tenantcontentcreate", multerupload.fields([
    { name: "tenantlogo" },
    { name: "tenantbannerimage" }
]), sanitizebody("tenantname", "tenanttagline", "tenantwebsite", "tenantbannertext",), tenantController.TenantContentCreate);

router.put("/tenantupdate", multerupload.fields([
    { name: "tenantlogo" },
    { name: "tenantbannerimage" }
]), sanitizebody("tenantname", "tenanttagline", "tenantwebsite", "tenantbannertext",
    "tenanturlname"), tenantController.TenantUpdate);

router.put("/tenantcontentupdate", multerupload.fields([
        { name: "tenantlogo" },
        { name: "tenantbannerimage" }
    ]), sanitizebody("tenantname", "tenanttagline", "tenantwebsite", "tenantbannertext",
        "tenanturlname"), tenantController.TenantContentUpdate);

router.delete("/tenantdelete/:tenantid", tenantController.TenantDelete);

router.delete("/tenantcontentdelete/:contentid", tenantController.TenantContentDelete);

router.get("/tenantgetall", tenantController.TenantGetAll);

router.get("/tenantgetbyid/:tenantid", tenantController.TenantGetByID);

router.get("/tenantcontentgetbyid/:contentid", tenantController.TenantContentGetByID);

router.get("/tenantcontentgetallbytenantid/:tenantid",  tenantController.TenantContentGetAllByTenantID);

router.get("/tenantgetbyurlname", sanitizeparams("tenanturlname"), tenantController.TenantGetByURLName);

router.get("/tenantcontentemailtemplate", tenantController.EmailTemplateGetByLanguageID);

router.get("/multilingual", multilingualController.getAllLanguages);
// router.post("/tenantupdateparamstorevalues", tenantController.TenantUpdateParamStoreValues);


module.exports = router;