const router = require("express").Router();

const userController = require("../controller/userController");
const tenantController = require("../controller/tenantController");
const { verifyToken } = require("../utils/jwt-token");
const { sanitizebody } = require("../utils/req-validator");


router.post("/useradmincreate", userController.UserAdminCreate);
router.post("/userlogin", userController.UserLogin);
router.post("/userchangepassword", verifyToken, userController.UserChangePassword);
router.post("/usercreate", verifyToken, sanitizebody("userfirstname", "userlastname", "useremailaddress"),
    userController.UserCreate);
router.post("/tenantupdateparamstorevalues", verifyToken,
    sanitizebody("tenanturlname"),
    tenantController.TenantUpdateParamStoreValues);


// router.post("/veretest", userController.VereTest);

module.exports = router;