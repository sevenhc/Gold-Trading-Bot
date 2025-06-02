const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");
const {
    GetParametersFromAWS,
    GetPersonaliseDetailsFromAWS,
    GetUserPersonaliseFromAWS,
} = require("../utils/aws-psm");
const { getClientEmail } = require("../models/user");
const tenantdb = require("../models/tenant");
const clientdb = require("../models/client");
const { getRedisCachedData, getNodeCachedData, setNodeCacheData } = require("../utils/cache");
const { json } = require("express");


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

exports.OffersGetAll = async (req, res, next) => {
    try {
        const starttime = new Date();

        const client = await getClient(req);
        let euid = undefined;
        if (client) {
            euid = client.externaluserid;
        }

        let offerlist
        let isFromCache = true;
        if (!req.query.cardnumber)
            offerlist = await getNodeCachedData(req.query.tenantid + "offerlist" + req.query.languagecode);

        if (!offerlist) {
            isFromCache = false
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

            let params = {
                limit: 1000,
                language: req.query.languagecode,
                externalUserId: req.query.cardnumber ? euid : undefined,
                cardId: req.query.cardnumber ? req.query.cardnumber : undefined,
                offerWall: 'true',
            }

            console.log("MASTR CONFIG : ", tenant)
            const getoffersurl = JSON.parse(tenant.tenantmasterconfig).api_version === "v1" ? "/offer" : "/offer/v2";

            console.log("URL : ", PULSE_ID_API + getoffersurl)
            const offers = await axios.get(PULSE_ID_API + getoffersurl, {
                params,
                headers: {
                    "x-api-key": kns.apiKey,
                    "x-api-secret": kns.apiSecret
                }
            });
            offerlist = JSON.stringify(offers.data);
            if (!req.query.cardnumber)
                await setNodeCacheData(req.query.tenantid + "offerlist" + req.query.languagecode, offerlist);
        }

        res.status(200).json(JSON.parse(offerlist));
    } catch (error) {
        if (error?.response?.status) {
            console.log("OffersGetAll Error: ", error.response.status, error.response.data)
        } else {
            console.log("OffersGetAll Error: ", error)
        }
        res.status(400).json({
            "message": "No Offers",
            "code": "OWER0010"
        });
    }
}

exports.OffersGetLite = async (req, res, next) => {

    try {

        let apiKey = "";
        let apiSecret = "";
        //if (tenant[0][0][0].hasOwnProperty("tenantid")) {
        apiKey = await GetParametersFromAWS("/isnofferwall-" + process.env.ENV + "/x-api-key");
        apiSecret = await GetParametersFromAWS("/isnofferwall-" + process.env.ENV + "/x-api-secret");
        //}

        let params = {
            limit: 1000,
            //language: req.query.languagecode,
            offerWall: 'true',
        }
        // params = (req.query.cardnumber === '') ? params : { cardId: req.query.cardnumber, ...params }

        const offers = await axios.get(PULSE_ID_API + "/offer/lite", {
            params,
            headers: {
                "x-api-key": apiKey.Parameter.Value,
                "x-api-secret": apiSecret.Parameter.Value
            }
        });

        res.status(200).json(offers.data.offers);
    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "No Offers",
            "code": "OWER0010"
        });
    }
}


exports.OfferGetByID = async (req, res, next) => {
    try {

        let offerlist;

        if (!req.query.cardnumber)
            offerlist = await getNodeCachedData(req.query.tenantid + "offerdetail" + req.query.languagecode + req.query.offerid)

        let selectedOffer;
        if (!offerlist) {

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

            const client = await getClient(req);
            let euid = undefined;
            if (client) {
                euid = client.externaluserid;
            }


            const getofferbyidurl = JSON.parse(tenant.tenantmasterconfig).api_version === "v1" ? "/offer" : "/offer/v2/" + req.query.offerid;

            let params = {
                offerId: JSON.parse(tenant.tenantmasterconfig).api_version === "v1" ? req.query.offerid : undefined,
                language: req.query.languagecode,
                externalUserId: req.query.cardnumber ? euid : undefined,
                cardId: req.query.cardnumber ? req.query.cardnumber : undefined,
                offerWall: 'true',
            }




            console.log("OFFERRRRR BY ID ", params)
            //const offers = await pulseidapi.get("/offer", {
            const offers = await axios.get(PULSE_ID_API + getofferbyidurl, {
                params,
                headers: {
                    "x-api-key": kns.apiKey,
                    "x-api-secret": kns.apiSecret
                },
            });
            console.log("OfFFERRRR GET BY ID RESPONSE : , ", offers.data)

            await setNodeCacheData(req.query.tenantid + "offerdetail" + req.query.languagecode + req.query.offerid, JSON.stringify(offers.data.offer))

            selectedOffer = offers.data.offers;
        } else {
            const offersset = JSON.parse(offerlist);



            selectedOffer = offersset
        }

        res.status(200).json({ offers: selectedOffer });
    } catch (error) {
        if (error?.response?.status === 400) {
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
        next(error);
    }
};

exports.PostOfferAttribution = async (req, res, next) => {
    const offerId = req.body.offerid
    const action = req.body.action
    const tenantid = req.body.tenantid;
    //const expiry = req.body.expiry;
    try {
        const tenant = await tenantdb.TenantGetByID(tenantid);
        const client = await getClient(req);
        let externalUserId = undefined;
        if (client) {
            externalUserId = client.externaluserid;
        }

        let apiKey = "";
        let apiSecret = "";

        if (tenant[0][0][0].hasOwnProperty("tenantid")) {
            apiKey = await GetParametersFromAWS(tenant[0][0][0].tenantapikeyname);
            apiSecret = await GetParametersFromAWS(tenant[0][0][0].tenantapisecretname);
        }

        let payload = {
            externalUserId,
            offerId: parseInt(offerId),
            action,
            //expiry
        };

        const offeractivatinurl = JSON.parse(tenant[0][0][0].tenantmasterconfig).api_version === "v1" ? "/offer/activation" : "/offer/activation";
        const attributions = await axios.post(
            PULSE_ID_API + offeractivatinurl,
            payload,
            {
                headers: {
                    "x-api-key": apiKey.Parameter.Value,
                    "x-api-secret": apiSecret.Parameter.Value
                }
            }
        );

        console.log("ATTR..............", attributions.data)
        res.status(200).json(attributions.data);

    } catch (error) {
        console.log("ATTRIBUTION POST ERROR : ", error)
        res.status(500).json({
            message: "Offer Activation Failed",
            code: "OWER0010",
        });
    }
}

exports.GetOfferAttribution = async (req, res, next) => {
    const offerId = req.query.offerid
    const cardId = req.query.cardId
    const tenantid = req.query.tenantid;
    try {
        // console.log(req.params, req.query)
        const tenant = await tenantdb.TenantGetByID(tenantid);
        const client = await getClient(req);
        let externalUserId = undefined;
        if (client) {
            externalUserId = client.externaluserid;
        }

        let apiKey = "";
        let apiSecret = "";
        // console.log(tenant)

        if (tenant[0][0][0].hasOwnProperty("tenantid")) {
            apiKey = await GetParametersFromAWS(tenant[0][0][0].tenantapikeyname);
            apiSecret = await GetParametersFromAWS(tenant[0][0][0].tenantapisecretname);
        }

        let payload = {
            externalUserId,
            offerId,
            cardId
            // action: action 
        };
        const offeractivatinurl = JSON.parse(tenant[0][0][0].tenantmasterconfig).api_version === "v1" ? "/attribution" : "/attribution";

        const attributions = await axios.get(PULSE_ID_API + offeractivatinurl, {
            params: payload,
            headers: {
                "x-api-key": apiKey.Parameter.Value,
                "x-api-secret": apiSecret.Parameter.Value
            },
        });
        res.status(200).json(attributions.data);

    } catch (error) {
        console.log('ERRORRR : ')
        res.status(500).json({
            message: "Something Went Wrong, Please Contact your Administrator",
            code: "OWER0010",
        });

    }
}

exports.PersonaliseGetSimilarOffers = async (req, res, next) => {
    try {
        const apiKey = await GetPersonaliseDetailsFromAWS(req.query.itemId);
        res.status(200).json(apiKey);

    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "No Offers",
            "code": "OWER0010"
        });
    }
}

exports.GetUserPersonaliseOffers = async (req, res, next) => {
    try {
        const apiKey = await GetUserPersonaliseFromAWS(req.query.userId);
        res.status(200).json(apiKey);

    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "No Offers",
            "code": "OWER0010"
        });
    }
}

exports.GetPopularCountOffers = async (req, res, next) => {
    try {
        const apiKey = await GetPopularOfferCountFromAWS(req.query.userId);
        res.status(200).json(apiKey);

    } catch (error) {
        console.log(error)
        res.status(400).json({
            "message": "No Offers",
            "code": "OWER0010"
        });
    }
}

exports.personalisationPutEventsAPI = async (req, res, next) => {
    const eventValue = req.body.eventValue
    const itemId = req.body.itemId
    const eventType = req.body.eventType;
    try {
        const client = await getClient(req);
        let externalUserId = undefined;
        if (client) {
            externalUserId = client.externaluserid;
        }
        let payload = {
            externalUserId,
            itemId,
            eventValue,
            eventType
        };

        const result = await axios.post(
            PULSE_ID_API + "/aws-personalisation",
            payload,
            {
                headers: {
                    "x-api-key": apiKey.Parameter.Value,
                    "x-api-secret": apiSecret.Parameter.Value
                }
            }
        );

        res.status(200).send('Success');

    } catch (error) {
        console.log("ERROR : ", error)
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}


exports.GetOfferLocations = async (req, res, next) => {
    try {

        const starttime = new Date();

        let offerlocs = await getNodeCachedData(req.query.offerid + "locations")

        if (!offerlocs) {
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

            let params = {
                offerId: req.query.offerid
            }


            const starttime2 = new Date();
            const getofferlocationurl = JSON.parse(tenant.tenantmasterconfig).api_version === "v1" ? "/location" : "/location";

            const offerLocations = await axios.get(PULSE_ID_API + getofferlocationurl, {
                params,
                headers: {
                    "x-api-key": kns.apiKey,
                    "x-api-secret": kns.apiSecret
                }
            });
            console.log("GetOfferLocations EXTERNAL CALL:", new Date().getTime() - starttime2)

            offerlocs = JSON.stringify(offerLocations.data.response)
            await setNodeCacheData(req.query.offerid + "locations", offerlocs)
        }

        console.log("GetOfferLocations :", new Date().getTime() - starttime)

        res.status(200).json(JSON.parse(offerlocs));
    } catch (error) {
        console.log("error.response.data", error)
        res.status(400).json({
            "message": "No Locations",
            "code": "OWER0010"
        });
    }
}