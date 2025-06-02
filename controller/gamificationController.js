const { default: axios } = require("axios");
const { GetParametersFromAWS } = require("../utils/aws-psm");
const tenantdb = require("../models/tenant");
const clientDB = require("../models/client");
const errorLogDb = require("../models/errorLog");
const CryptoJS = require("crypto-js");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");
const { uploadAnalytics } = require("../utils/aws-s3");

exports.PickRewards = async (req, res, next) => {
  try {
    const { campaignId, tenantid } = req.body;
    const euid = req.client.externaluserid;

    const tenantfromcache = await getNodeCachedData(tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    // Get the transaction count
    const transactionCount = await errorLogDb.getTransactionCount(campaignId, euid, tenantid);

    let payload = {
      campaignId,
      euid,
      transactionCount
    };

    const rewards = await axios.post(
      PULSE_ID_API + "/gamification/pick-reward",
      payload,
      {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );

    // Encrypt the rewards.data value
    const jsonString = JSON.stringify(rewards.data);
    const encryptedData = CryptoJS.AES.encrypt(jsonString, DATA_REV_ENCRYPT_KEY).toString();

    // Replace the original value with the encrypted value
    rewards.data = {};
    rewards.data.encryptedData = encryptedData;

    res.status(200).json(rewards.data);
  } catch (error) {
    console.error("Error in /pick-reward:", error);
    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.RewardIssue = async (req, res, next) => {
  let tenantid, transactionId, rewardAmount, campaignId;
  const euid = req.client.externaluserid;
  try {
    ({ campaignId, tenantid, transactionId, rewardAmount } = req.body);

    const tenantfromcache = await getNodeCachedData(tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    let payload = {
      transactionId,
      rewardAmount,
      campaignId,
      euid,
      distributorId: 325,
    };

    const offers = await axios.post(
      PULSE_ID_API + "/gamification/reward-issue",
      payload,
      {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );

    const analyticsData = req.body.analytics;
    analyticsData.ti = new Date();
    await uploadAnalytics(analyticsData, "action-conversion");

    res.status(200).json(offers.data);
  } catch (error) {
    console.error("Error in /reward-issue:", error);

    // Save error details to database
    try {
      await errorLogDb.createErrorLogs({
        tenantid,
        transactionId,
        rewardAmount,
        campaignId,
        euid,
        errorMessage: error.message,
        errorCode: error.response ? error.response.data.errorCode : "UNKNOWN_ERROR",
        status: "Active"
      });
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError);
    }

    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const euid = req.client.externaluserid;
    const tenantfromcache = await getNodeCachedData(req.query.tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(req.query.tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(req.query.tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(req.query.tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(req.query.tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    const offers = await axios.get(
      PULSE_ID_API + "/gamification/get-campaigns",
      {
        params: {
          euid
        },
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );

    res.status(200).json(offers.data);
  } catch (error) {
    console.error("Error in /get-campaigns:", error);
    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.getCampaignRewardOptions = async (req, res, next) => {
  try {
    console.log("Received get-campaign-reward-options request");
    const tenant = await tenantdb.TenantGetByID(req.query.tenantid);
    const campaignId = req.query.campaignId;

    let apiKey = "";
    let apiSecret = "";

    if (tenant[0][0][0].hasOwnProperty("tenantid")) {
      apiKey = await GetParametersFromAWS(tenant[0][0][0].tenantapikeyname);
      apiSecret = await GetParametersFromAWS(
        tenant[0][0][0].tenantapisecretname
      );
    }

    const rewardOptions = await axios.get(
      PULSE_ID_API + "/gamification/get-campaign-reward-options",
      {
        params:{
          campaignId
        },
        headers: {
          "x-api-key": apiKey.Parameter.Value,
          "x-api-secret": apiSecret.Parameter.Value,
        },
      }
    );

    res.status(200).json(rewardOptions.data);
  } catch (error) {
    console.error("Error in /get-campaign-reward-options:", error);
    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.getRewards = async (req, res, next) => {
  try {
    console.log("Received get-rewards request");
    const tenant = await tenantdb.TenantGetByID(req.query.tenantid);
    const campaignId = req.query.campaignId;
    const euid = req.client.externaluserid;

    let apiKey = "";
    let apiSecret = "";

    if (tenant[0][0][0].hasOwnProperty("tenantid")) {
      apiKey = await GetParametersFromAWS(tenant[0][0][0].tenantapikeyname);
      apiSecret = await GetParametersFromAWS(
        tenant[0][0][0].tenantapisecretname
      );
    }

    const rewards = await axios.get(
      PULSE_ID_API + "/gamification/get-rewards",
      {
        params:{
          euid,
          campaignId
        },
        headers: {
          "x-api-key": apiKey.Parameter.Value,
          "x-api-secret": apiSecret.Parameter.Value,
        },
      }
    );

    // Encrypt the rewards.data value
    const jsonString = JSON.stringify(rewards.data);
    const encryptedData = CryptoJS.AES.encrypt(jsonString, DATA_REV_ENCRYPT_KEY).toString();

    // Replace the original value with the encrypted value
    rewards.data = {};
    rewards.data.encryptedData = encryptedData;

    res.status(200).json(rewards.data);
  } catch (error) {
    console.error("Error in /get-rewards:", error);
    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};


exports.getRewardDetails = async (req, res, next) => {
  try {
    const { tenantid, campaignId } = req.body;
    const euid = req.client.externaluserid;

    const tenantfromcache = await getNodeCachedData(tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    // Get the transaction count
    const transactionCount = await errorLogDb.getTransactionCount(0, euid, tenantid);

    let payload = {
      euid,
      transactionCount,
      campaignId
    };

    const offers = await axios.post(
      PULSE_ID_API + "/gamification/get-campaign",
      payload,
      {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );

    res.status(200).json(offers.data);
  } catch (error) {
    console.error("Error in /get-reward:", error);
    if (error?.response && error?.response?.status === 400) {
      res.status(400).json({
        message: error?.response?.data?.message,
        code: error?.response?.data?.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.getWinningRewardDetails = async (req, res, next) => {
  try {
    const { tnxId, tenantid } = req.body;

    const tenantfromcache = await getNodeCachedData(tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    let payload = {
      tnxId
    };

    let response = {};

    const rewardDetails = await axios.post(
      PULSE_ID_API + "/gamification/get-bonus-reward-details",
      payload,
      {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );
    if (rewardDetails.status === 200) {
      const client = await clientDB.ClientGetByExternalID(rewardDetails.data.externalUserId);
      response = { rewardDetails: rewardDetails.data, langId: client[0][0][0].defaultlanguageid }
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in /get-wining-reward-details:", error);
    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};

exports.SaveSocialShareDetails = async (req, res, next) => {
  let tnxId, platform, tenantid;
  try {
    ({ tnxId, platform, tenantid } = req.body);

    const tenantfromcache = await getNodeCachedData(tenantid);
    let tenant;

    if (!tenantfromcache) {
      const tdata = await tenantdb.TenantGetByID(tenantid);
      tenant = tdata[0][0][0];

      await setNodeCacheData(tenantid, JSON.stringify(tenant));
    } else {
      tenant = JSON.parse(tenantfromcache)
    }

    let kns = await getNodeCachedData(tenantid + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
      if (!kns) {
        apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        await setNodeCacheData(tenantid + "KnS", JSON.stringify(kns))
      } else {
        kns = JSON.parse(kns)
      }
    }

    let payload = {
      "transactionId": tnxId,
      "socialPlatform": platform
    };

    const response = await axios.post(
      PULSE_ID_API + "/gamification/social-share-details",
      payload,
      {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
      }
    );

    const analyticsData = req.body.analytics;
    analyticsData.ti = new Date();
    await uploadAnalytics(analyticsData, "action-conversion");

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in /social-share-details:", error);

    if (error.response && error.response.status === 400) {
      res.status(400).json({
        message: error.response.data.message,
        code: error.response.data.errorCode,
      });
    } else {
      res.status(500).json({
        message: "Something Went Wrong, Please Contact your Administrator",
        code: "OWER0010",
      });
    }
  }
};