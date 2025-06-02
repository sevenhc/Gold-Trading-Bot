const router = require("express").Router();

const userController = require("../controller/userController");

router.post("/userlogin", userController.UserLogin);
router.post("/usercreate", userController.UserCreate);
router.post("/userverification", userController.UserVerification)
router.post("/userrefresh", userController.UserRefresh);
router.post("/usersignout", userController.UserSignOut);

// router.post("/usergenerateToken", userController.UserGenerateToken);

module.exports = router;


// router.post("/usercreate", verifyToken, userController.UserCreate);
// router.put("/userupdate", verifyToken, userController.UserUpdate);
// router.delete("/userdelete", verifyToken, userController.UserDelete);
// router.get("/usergetall", verifyToken, userController.UserGetAll);
// router.get("/usergetbyid/:userid", verifyToken, userController.UserGetByID);
// router.post("/userchangepassword", verifyToken, userController.UserChangePassword);