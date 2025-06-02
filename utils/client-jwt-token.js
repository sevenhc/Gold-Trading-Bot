const jwt = require("jsonwebtoken");
const clientdb = require("../models/client");
const { getRedisCachedData, delRedisCachedData, setRedisCacheData } = require("./cache");
const { analytics } = require("../controller/analyticsController");
const { uploadAnalytics } = require("./aws-s3");



const clearUserCookies = async (req, res, code, message) => {

  const cl = req.cookies["ow-c"];

  if (cl) {
    const sessionanalytics = {
      ui: cl.externaluserid,
      ti: cl.tenantid,
      tn: cl.tenantname,
      si: cl.sessionid,
      ss: cl.sessionstart,
      se: new Date()
    };

    await uploadAnalytics(sessionanalytics, "session");
  }

  return res.status(code)
    .cookie("at", null, {
      expires: new Date(new Date().getTime() - 60 * 60 * 60 * 1000),
      httpOnly: true,
      domain: HOST_DOMAIN,
      sameSite: "none",
      secure: true
    })
    .cookie("as", false, {
      expires: new Date(new Date().getTime() - 60 * 60 * 60 * 1000),
      domain: HOST_DOMAIN,
      sameSite: "none",
      secure: true
    })
    .cookie("rt", null, {
      expires: new Date(new Date().getTime() - 60 * 60 * 60 * 1000),
      httpOnly: true,
      domain: HOST_DOMAIN,
      sameSite: "none",
      secure: true
    })
    .cookie("rtid", false, {
      expires: new Date(new Date().getTime() - 60 * 60 * 60 * 1000),
      domain: HOST_DOMAIN,
      sameSite: "none",
      secure: true
    })
    .cookie("ow-c", null, {
      expires: new Date(new Date().getTime() - 60 * 60 * 60 * 1000),
      domain: HOST_DOMAIN,
      sameSite: "none",
      secure: true
    })
    .json(message);

  // .clearCookie("at", {
  //   sameSite: "none",
  //   httpOnly: true,
  //   domain: HOST_DOMAIN,
  //   secure: true
  // })
  // .clearCookie("as", {
  //   sameSite: "none",
  //   httpOnly: true,
  //   domain: HOST_DOMAIN,
  //   secure: true
  // })
  // .clearCookie("rt", {
  //   sameSite: "none",
  //   httpOnly: true,
  //   domain: HOST_DOMAIN,
  //   secure: true
  // })
  // .clearCookie("rtid", {
  //   sameSite: "none",
  //   httpOnly: true,
  //   domain: HOST_DOMAIN,
  //   secure: true
  // })
  // .clearCookie("ow-c", {
  //   sameSite: "none",
  //   httpOnly: true,
  //   domain: HOST_DOMAIN,
  //   secure: true
  // })
  // .json(message);
}

const clientSignOut = async (req, res, next) => {
  const refreshToken = req.cookies.rt;
  //refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  const accessToken = req.cookies.at;
  //accessTokens = accessTokens.filter((token) => token !== accessToken);
  // await clientdb.DeleteTokens(accessToken, refreshToken);
  await delRedisCachedData([accessToken, refreshToken])
  return await clearUserCookies(req, res, 200, "You logged out successfully.");
};

const refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.rt;
  const accessToken = req.cookies.at;
  if (!refreshToken) {
    console.log("RT not in Request")
    return await clearUserCookies(req, res, 401, "You are not authenticated!");
  }
  // const rt = await clientdb.GetTokens(refreshToken, "refreshtoken")
  const rtredis = await getRedisCachedData(refreshToken)
  if (!rtredis) {
    console.log("RT not in DB")
    return await clearUserCookies(req, res, 403, "Refresh token is not valid!!");
  }
  jwt.verify(refreshToken, JWT_KEY, async (err, client) => {
    if (err) {
      console.log("RT Verify Fail")
      // await clientdb.DeleteTokens(accessToken, refreshToken);
      await delRedisCachedData([accessToken, refreshToken]);
      return await clearUserCookies(req, res, 403, "Refresh token is not valid!!!");
    }
    //refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    // await clientdb.DeleteTokens(accessToken, refreshToken);
    const newAccessToken = generateAccessToken(
      client.clientid,
      client.userkey,
      client.tenantid,
      client.externaluserid
    );
    const newRefreshToken = generateRefreshToken(
      client.clientid,
      client.userkey,
      client.tenantid,
      client.externaluserid
    );

    // await clientdb.AddTokens(newAccessToken, newRefreshToken);
    await setRedisCacheData(newAccessToken, newAccessToken);
    await setRedisCacheData(newRefreshToken, newRefreshToken);


    res.status(202)
      .cookie("at", newAccessToken, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        httpOnly: true,
        domain: HOST_DOMAIN,
        sameSite: "none",
        secure: true
      })
      .cookie("as", true, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        domain: HOST_DOMAIN,
        sameSite: "none",
        secure: true
      })
      .cookie("rt", newRefreshToken, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        httpOnly: true,
        domain: HOST_DOMAIN,
        sameSite: "none",
        secure: true
      })
      .cookie("rtid", true, {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        domain: HOST_DOMAIN,
        sameSite: "none",
        secure: true
      })
      .cookie("ow-c", req.cookies['ow-c'], {
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        domain: HOST_DOMAIN,
        sameSite: "none",
        secure: true
      })
      .json(req.cookies['ow-c']);


  });
};

const verifyToken = async (req, res, next) => {
  const authToken = req.cookies.at;
  if (authToken) {
    // const at = await clientdb.GetTokens(authToken, "accesstoken")
    const atredis = await getRedisCachedData(authToken)

    if (!atredis) {
      console.log("AT not in req")
      return await clearUserCookies(req, res, 403, "Access token is not valid!!");
    }

    const token = authToken;
    jwt.verify(token, JWT_KEY, async (err, client) => {
      if (err) {
        console.log("AT Verify Failed")
        await delRedisCachedData([authToken]);

        return await clearUserCookies(req, res, 403, "Invalid Token.");
      }
      let clientid = req.body.hasOwnProperty("clientid")
        ? req.body.clientid
        : req.params.hasOwnProperty("clientid")
          ? req.params.clientid
          : req.query.clientid;

      let tenantid = req.body.hasOwnProperty("tenantid")
        ? req.body.tenantid
        : req.params.hasOwnProperty("tenantid")
          ? req.params.tenantid
          : req.query.tenantid;

      if (parseInt(clientid) === client.clientid && parseInt(tenantid) === client.tenantid) {

        req.client = client;
        next();
      } else {
        console.log("AT Not match")

        return await clearUserCookies(req, res, 403, "Invalid Tokens.");
      }
    });

  } else {
    return await clearUserCookies(req, res, 401, "You are not authenticated");
  }
  //next();
};



const generateAccessToken = (clientid, userkey, tenantid, externaluserid) => {
  const accessToken = jwt.sign({ clientid, userkey, tenantid, externaluserid, timestamp: new Date().getTime() }, JWT_KEY, {
    expiresIn: "15m",
  });
  //accessTokens.push(accessToken);
  return accessToken;
};

const generateRefreshToken = (clientid, userkey, tenantid, externaluserid) => {
  const refreshToken = jwt.sign({ clientid, userkey, tenantid, externaluserid, timestamp: new Date().getTime() }, JWT_KEY, {
    expiresIn: "15m",
  });
  //refreshTokens.push(refreshToken);
  return refreshToken;
};

module.exports = {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  clientSignOut,
};
