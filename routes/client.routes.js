const router = require("express").Router();

const clientController = require("../controller/clientController");
const { verifyToken } = require("../utils/client-jwt-token");
const { sanitizebody, sanitizeemail } = require("../utils/req-validator");

router.post("/clientlogin", sanitizeemail("clientemail"), clientController.ClientLogin);
router.post("/clientrefresh", clientController.ClientRefresh);
router.post("/clientsignout", clientController.ClientSignOut);
router.post("/clientverification", clientController.ClientVerification)
router.post("/clientcreate", sanitizebody("clientemail"), sanitizeemail("clientemail"),
    clientController.ClientCreate);

router.put("/clientlanguageupdate", verifyToken, clientController.updateClientLanguage);

router.post("/getclientverifytoken", clientController.getMagicVerifyToken);

router.post("/clientmagicverification", clientController.verifyMagicToken);

router.post("/updateemail", sanitizebody("newemail"), sanitizeemail("newemail"), verifyToken, clientController.updateEmail);


// router.put("/refreshclientdata", verifyToken, clientController.RefrehClientData);

// router.put("/clientupdate", clientController.ClientUpdate);
// router.delete("/clientdelete", clientController.ClientDelete);
// router.get("/clientgetall", clientController.ClientGetAll);
// router.get("/clientgetbyid/:clientid", clientController.ClientGetByID);
// router.post("/clientchangepassword", clientController.ClientChangePassword);

module.exports = router;
