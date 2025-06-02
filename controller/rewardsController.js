const { default: axios } = require("axios");
const tenantdb = require("../models/tenant");
const { GetParametersFromAWS } = require("../utils/aws-psm");
const moment = require("moment-timezone");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");


const pendingStatuses = "21";
const confirmedStatuses = "8|9";
const rejectStatuses = "10|13";
const allStatuses = "8|9|10|13|21";

exports.getRewardInfo = async (req, res, next) => {
  const { status, fromtDate, toDate, merchantId } = req.query;
  const customerId = req.client.externaluserid;
  let rewardStatus = "";
  let rStatus = "";
  const rewards = [];

  try {
    let rewardInfo = { data: { rewards: [], merchantList: [] } };

    try {


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
          } else{
              kns = JSON.parse(kns)
          }
      }
      const params = {
        isISN: "true",
        customerId,
        // rewardStatus,
        // txFromDate: fromtDate,
        // txToDate: toDate,
        // merchantId,
      };
      // console.log("customerID : ", customerId)
      rewardInfo = await axios.get(PULSE_ID_API + "/reward/reward-lite", {
        headers: {
          "x-api-key": kns.apiKey,
          "x-api-secret": kns.apiSecret,
        },
        params,
      });

    //   console.log("REWARD LIST : ", rewardInfo)
    } catch (error) {
      // Specifically handle the 'Cardholder not found' case
      if (error?.response && error?.response?.data?.errorCode === -406) {
        console.error(
          "Cardholder not found, proceeding with referral rewards..."
        );
      } else {
        // Re-throw other errors to be caught by the outer catch block
        throw error;
      }
    }

    // const { rewards: rewardList, merchantList } = rewardInfo.data;
    // console.log("REWARD LIST FROM API :", rewardList)
    // if (rewardList) {
    //   console.log("IN IF")
    //   for (let merchant of rewardList) {
    //     console.log("IN FOR : ", merchant)

    //     if (
    //       merchant.rewardStatus === "CREDIT SUCCESSFUL" ||
    //       merchant.rewardStatus === "CREDIT PENDING"
    //     ) {
    //       rStatus = "Confirmed";
    //     } else if (
    //       merchant.rewardStatus === "CREDIT UNSUCCESSFUL" ||
    //       merchant.rewardStatus === "CREDIT FAILED"
    //     ) {
    //       rStatus = "Rejected";
    //     } else if (merchant.rewardStatus === "REWARD PENDING APPROVAL") {
    //       rStatus = "Pending";
    //     }

       
    //     const reward = {
    //       txDateUtc: moment(merchant.txDateUtc).format(
    //         "YYYY/MM/DD \n HH:mm:ss"
    //       ),
    //       txAmount: merchant.txCurrency + " " + merchant.txAmount,
    //       rewardAmount:
    //         merchant.partnerPreferredCurrency +
    //         " " +
    //         merchant.rewardAmountInPreferredCurrency,
    //       merchantName: merchant.merchantName,
    //       rewardStatus: rStatus,
    //       merchantImage: merchant.merchantImage,
    //       bonusAmount: merchant.bonusAmount,
    //       bonusRewardDate: moment(merchant.bonusRewardDate).format(
    //         "YYYY/MM/DD \n HH:mm:ss"
    //       )
    //     };

    //     console.log("REWARD ITEM : ", reward)
    //     rewards.push(reward);
    //   }
    // }



    // console.log("REWARD LIST TO SEND : ", rewards)
    res.status(200).json(rewardInfo.data);
  } catch (error) {
    console.log(error?.response?.data);
    res.status(400).json({
      message: error?.response?.data?.message,
      code: error?.response?.data?.errorCode,
    });
  }
};

