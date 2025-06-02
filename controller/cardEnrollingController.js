const cardenrollingDB = require("../models/cardEnrolling")
const clientDB = require("../models/client")
const tenantdb = require("../models/tenant")
const crypto = require('crypto')
const CryptoJS = require("crypto-js");
const auditLog = require("../utils/auditlog");
const { RSAEncryptionB64, ConvertToBase64, AESGCMDecryption, RSADecryption, ConvertToASCII, RSAEncryptionURLB64 } = require("../utils/encryptions");
const { default: axios } = require("axios");
const { GetParametersFromAWS } = require("../utils/aws-psm");
const { getNodeCachedData, setNodeCacheData, getRedisCachedData } = require("../utils/cache");
const jwt = require("jsonwebtoken");


const component = "CARD_ENROLL"

exports.GetAllClientCards = async (req, res, next) => {
    try {
        const clientcardsres = await cardenrollingDB.getAllClientCards(req.query);
        const clientcards = [...clientcardsres[0]]

        for (let i = 0, j = clientcards.length; i < j; i++) {
            clientcards[i].last4digits = CryptoJS.AES.decrypt(clientcards[i].last4digits, DATA_ENCRYPT_KEY, { iv: clientcards[i].cardIV }).toString(CryptoJS.enc.Utf8);
        }
        res.status(200).json(clientcards);
    } catch (error) {
        console.log("GET ALL CARDS ERROR : ", error)
        res.status(500)
    }
}

exports.DeleteClientCard = async (req, res, next) => {
    try {

        const clientcard = await cardenrollingDB.deleteClientCard(req.query)

        const client = req.cookies["ow-c"];

        //res.status(200).json();
        res.status(202)
            .cookie("ow-c", req.cookies["ow-c"], {
                expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                domain: HOST_DOMAIN,
                sameSite: "none",
                secure: true
            })
            .json(req.cookies["ow-c"]);

        await auditLog.addAduditLogs(component, "DeleteClientCard", req.query, "DELETE", req.query.id, req.query.clientid, req.query.tenantid)
    } catch (error) {
        console.log("DELETE CARD ERROR : ", error)
        res.status(500)
    }
}

exports.CreateClientCard = async (req, res, next) => {
    const card = {}
    card.randomIV = crypto.randomUUID()
    card.userkey = req.client.externaluserid
    card.userid = req.body.UserId
    card.cardnumber = req.body.CardId
    card.referenceid = req.body.ReferenceId
    card.isdefault = req.body.isdefault
    card.last4digits = CryptoJS.AES.encrypt(req.body.CardLast4, DATA_ENCRYPT_KEY, { iv: card.randomIV }).toString();

    try {
        const existingCard = await cardenrollingDB.getCardByNumber(card);
        if (existingCard[0][0].length === 0) {
            const cardEnroll = await cardenrollingDB.createClientCard(card)

            const client = req.cookies["ow-c"];

            //res.status(200).json();
            res.status(202)
                .cookie("ow-c", {
                    ...client,
                    isenrolled: 1,
                    visaclientid: card.userid,
                    domain: HOST_DOMAIN
                }, {
                    expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                    domain: HOST_DOMAIN,
                    sameSite: "none",
                    secure: true
                })
                .json({
                    ...client,
                    isenrolled: 1,
                    visaclientid: card.userid,
                    domain: HOST_DOMAIN
                });

            const { randomIV, ...cardMod } = card

            await auditLog.addAduditLogs(component, "createClientCard", cardMod, "POST", cardEnroll[0].insertId, req.body.clientid, req.body.tenantid)
        } else {
            res.status(400).json("Card Exist");
            await auditLog.addAduditLogs(component, "createClientCard", cardMod, "POST", 0, req.body.clientid, req.body.tenantid)
        }

    } catch (error) {
        console.log("CREATE CARD ERROR : ", error)
        res.status(500)
    }
}

exports.UnenrollClient = async (req, res, next) => {

    try {
        const cardEnroll = await cardenrollingDB.UnenrollClient(req.body)

        const client = req.cookies["ow-c"];

        //res.status(200).json();
        res.status(202)
            .cookie("ow-c", {
                ...client,
                isenrolled: 0,
                visaclientid: null,
                domain: HOST_DOMAIN
            }, {
                expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                domain: HOST_DOMAIN,
                sameSite: "none",
                secure: true
            })
            .json({
                ...client,
                isenrolled: 0,
                visaclientid: null,
                domain: HOST_DOMAIN
            });



        await auditLog.addAduditLogs(component, "UnenrollClient", req.body, "PUT", req.body.clientid, req.body.clientid, req.body.tenantid)
    } catch (error) {
        console.log("UNENROLL CLIENT ERROR : ", error)
        res.status(500)
    }
}


exports.CardSetDefault = async (req, res, next) => {
    try {
        const clientcard = await cardenrollingDB.CardSetDefault(req.body)
        res.status(202)
            .cookie("ow-c", req.cookies["ow-c"], {
                expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                domain: HOST_DOMAIN,
                sameSite: "none",
                secure: true
            })
            .json(req.cookies["ow-c"]);

        await auditLog.addAduditLogs(component, "ClientCreate", req.body, "POST", req.body.id, req.body.clientid, req.body.tenantid)
    } catch (error) {
        console.log("SET DEFAULT CARD ERROR : ", error)
        res.status(500)
    }
}

exports.VisaParametersForCardEnrolling = async (req, res, next) => {
    const response = {};
    const clientId = req.query.clientid;
    const tenantId = req.query.tenantid;

    try {
        const client = await clientDB.getClientEmail(clientId, tenantId);

        response.visa_key = VISA_AES_KEY;
        response.visa_iv = VISA_AES_IV;

        const rsaencryptedkeyand4Express = RSAEncryptionB64(`{Key:${ConvertToBase64(VISA_AES_KEY)},IV:${ConvertToBase64(VISA_AES_IV)}}`);



        const rsaencryptedkeyand4Direct = RSAEncryptionB64(`{"Key":"${ConvertToBase64(VISA_AES_KEY)}","IV":"${ConvertToBase64(VISA_AES_IV)}"}`);

        response.visa_info1_express = rsaencryptedkeyand4Express; //VISA_INFO1;
        response.visa_info1_direct = rsaencryptedkeyand4Direct; //VISA_INFO1;
        response.visa_api = VISA_ENROLL_API;
        response.community_code = COMMUNITY_CODE;
        response.expressmini_url = EXPRESS_MINI_URL;
        response.cert_version = CERT_VERSION
        const { email, authtag, clientIV, displayemail } = client[0][0];


        response.email = AESGCMDecryption(email, authtag, clientIV);
        if (displayemail) {
            const demail = CryptoJS.AES.decrypt(displayemail, DATA_ENCRYPT_KEY, { iv: clientIV }).toString(CryptoJS.enc.Utf8);
            response.displayemail = demail + "@" + response.email.split("@")[1]
        } else {
            response.displayemail = response.email
        }

        res.status(200).json(response);
    } catch (error) {
        console.log("GET VISA PARAMS ERROR : ", error)
        res.status(500)
    }
}


exports.GetVisaCardUser = async (req, res, next) => {

    const userkey = req.client.externaluserid;

    try {
        const user = await axios.get(VISA_GATEWAY_URL + "/merchant/group/getbyuser", {
            params: {
                userKey: userkey,
                communityCode: COMMUNITY_CODE
            }
        });

        res.status(200).send(JSON.parse(user.data));
    } catch (error) {

        console.log("GET USER CARD VOP ERROR : ", error)

        res.status(400).json({
            "message": "No Info found",
            "code": "OWER0009"
        });
    }
}



exports.EmailSubscription = async (req, res, next) => {
    try {

        await clientDB.updateEmailSubscription(req.body.isemailsubscribed, req.body.clientid, req.body.tenantid);

        const clientcardsres = await cardenrollingDB.getAllClientCards(req.query);
        const clientcards = [...clientcardsres[0]]

        if (clientcards.length > 0) {

            const euid = req.client.externaluserid;
            const tenantfromcache = await getNodeCachedData(req.body.tenantid);
            let tenant;

            if (!tenantfromcache) {
                const tdata = await tenantdb.TenantGetByID(req.body.tenantid);
                tenant = tdata[0][0][0];

                await setNodeCacheData(req.body.tenantid, JSON.stringify(tenant));
            } else {
                tenant = JSON.parse(tenantfromcache)
            }

            let kns = await getNodeCachedData(req.body.tenantid + "KnS");
            let apiKey = "";
            let apiSecret = "";

            if (tenant.hasOwnProperty("tenantid")) {
                if (!kns) {
                    apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
                    apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
                    kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
                    await setNodeCacheData(req.body.tenantid + "KnS", JSON.stringify(kns))
                } else {
                    kns = JSON.parse(kns)
                }
            }

            const params = {
                externalUserId: euid,
                status: req.body.isemailsubscribed,
            }


            const subscription = await axios.put(PULSE_ID_API + "/email-campaign-offers/update-subscription-status", null, {
                params,
                headers: {
                    "x-api-key": kns.apiKey,
                    "x-api-secret": kns.apiSecret
                }
            });

        }

        res.status(200).json(req.body.isemailsubscribed);
    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "Subscription Error",
            "code": "OWER0011"
        });
    }
}



exports.EmailGetSubscription = async (req, res, next) => {
    try {
        // const euid = req.client.externaluserid;
        // const tenantfromcache = await getNodeCachedData(req.body.tenantid);
        // let tenant;

        // if (!tenantfromcache) {
        //     const tdata = await tenantdb.TenantGetByID(req.body.tenantid);
        //     tenant = tdata[0][0][0];

        //     await setNodeCacheData(req.body.tenantid, JSON.stringify(tenant));
        // } else {
        //     tenant = JSON.parse(tenantfromcache)
        // }

        // let kns = await getNodeCachedData(req.body.tenantid + "KnS");
        // let apiKey = "";
        // let apiSecret = "";

        // if (tenant.hasOwnProperty("tenantid")) {
        //     if (!kns) {
        //         apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
        //         apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
        //         kns = { apiKey: apiKey.Parameter.Value, apiSecret: apiSecret.Parameter.Value }
        //         await setNodeCacheData(req.body.tenantid + "KnS", JSON.stringify(kns))
        //     } else {
        //         kns = JSON.parse(kns)
        //     }
        // }

        // const params = {
        //     externalUserId: euid,
        // }

        const subscription = await clientDB.getEmailSubscription(req.body.clientid, req.body.tenantid)
        // const subscription = await axios.get(PULSE_ID_API + "/email-campaign-offers/get-subscription-status", {
        //     params: params,
        //     headers: {
        //         "x-api-key": kns.apiKey,
        //         "x-api-secret": kns.apiSecret
        //     }
        // });

        console.log("SUBSCRIPTION : ", subscription)
        const email_campaign_is_subscribed = subscription[0][0] ? subscription[0][0].isemailsubscribed : 1;

        res.status(200).json(email_campaign_is_subscribed);
    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "Get Subscription Error",
            "code": "OWER0012"
        });
    }
}



const getClient = async (req) => {
    const authToken = req.cookies.at;

    if (authToken) {
        const redisat = await getRedisCachedData(authToken);

        if (!redisat) {
            return undefined;
        }
        const cl = jwt.verify(authToken, JWT_KEY, async (err, client) => {
            if (err) {
                return undefined;
            }
            return client;
        });
        return cl;
    }
};

exports.EmailUnsubscribe = async (req, res, next) => {
    try {
        const params = {
            externalUserId: req.body.externaluserid,
            distributorId: req.body.distributorid,
            status: false
        }
        const url = PULSE_ID_API + "/email-campaign-update-subscription-status?externalUserId=" +
            params.externalUserId + "&distributorId=" + params.distributorId + "&status=0";
        const subscription = await axios.put(url);

        res.status(200).json(subscription.data);
    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "Unsubscription Error",
            "code": "OWER0013"
        });
    }
}


exports.SetAlias = async (req, res, next) => {
    try {

        const tenantid = req.body.tenantid

        if (req.body.alias.trim() === "" || req.body.alias.trim().length > 10) {
            const tenantfromcache = await getNodeCachedData(tenantid);
            let tenant;

            if (!tenantfromcache) {
                const tdata = await tenantdb.TenantGetByID(tenantid);
                tenant = tdata[0][0][0];

                await setNodeCacheData(tenantid, JSON.stringify(tenant));
            } else {
                tenant = JSON.parse(tenantfromcache)
            }
            /// external api
            let kns = await getNodeCachedData(tenantid + "KnS");
            let apiKey = "";
            let apiSecret = "";

            // if (tenant[0][0][0].hasOwnProperty("tenantid")) {

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

            const client = await getClient(req);
            let euid = undefined;
            if (client) {
                euid = client.externaluserid;
            }
            console.log(req.body)
            const emailchange = await axios.post(PULSE_ID_API + "/user/update-alias",
                {
                    externalUserId: euid,
                    cardId: req.body.cardnumber,
                    alias: req.body.alias
                },
                {
                    headers: {
                        "x-api-key": kns.apiKey,
                        "x-api-secret": kns.apiSecret
                    }
                }
            );

            await cardenrollingDB.updateCardAlias(req.body.cardnumber, req.body.alias, req.body.tenantid, req.body.clientid)


            res.status(200).send("success");
        }else{
           res.status(400).json({
            "message": `${req.body.alias.trim()===""?"Alias cannot be empty":
                req.body.alias.trim()>10?"Alias cannot be exceed 10 characters":
                "Alias Change Error, Please contact the relevant customer service team"
            }`,
            "code": "OWER0014"
        }); 
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "Alias Change Error, Please contact the relevant customer service team ",
            "code": "OWER0013"
        });
    }
}


