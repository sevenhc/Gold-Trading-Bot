const clientdb = require("../models/client");
const tetnantDB = require("../models/tenant")
const crypto = require('crypto')
const CryptoJS = require("crypto-js");
const emailClient = require('../utils/email-client')
const auditLog = require("../utils/auditlog")
const { generateAccessToken, generateRefreshToken, refreshToken, clientSignOut } = require("../utils/client-jwt-token");
const axios = require("axios");
const fs = require("fs");
const { AESGCMDecryption, AESGCMEncryption } = require("../utils/encryptions");
// const { ConfigurationServicePlaceholders } = require("aws-sdk/lib/config_service_placeholders");
const component = "CLIENT";
// const regexPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const regexPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const jwt = require("jsonwebtoken");

const isValidDomain = require('is-valid-domain');
const { setCacheData, setRedisCacheData, getRedisCachedData, getNodeCachedData, setNodeCacheData } = require("../utils/cache");
const { GetParametersFromAWS } = require("../utils/aws-psm");
const { cookie } = require("request");

let captchatokens = [];

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

exports.ClientCreate = async (req, res, next) => {
    console.log('SIGNUP - IN');
    const token = req.body.captchatoken;
    const tenantId = req.body.clienttenantid;
    let isExist = false;
    let now = new Date();
    now.setMinutes(now.getMinutes() - 5);

    // for (let i = 0, j = captchatokens.length; i < j; i++) {
    //     if (captchatokens[i]?.token === token) {
    //         isExist = true;
    //     }
    //     if (captchatokens[i]?.time < now) {
    //         captchatokens.splice(i, 1);
    //     }
    // }
    const emailHash = CryptoJS.HmacSHA3(req.body.clientemail + req.body.clienttenantid, DATA_ENCRYPT_KEY).toString();
    if (token !== "") {
        console.log('SIGNUP - Captcha Token Available :', emailHash);
        if (!isExist) {
            console.log('SIGNUP - Captcha Token is New :', emailHash);
            captchatokens.push({ token, time: new Date() });

            const tenantfromcache = await getNodeCachedData(tenantId);
            let tenant;

            if (!tenantfromcache) {
                const tdata = await tetnantDB.TenantGetByID(tenantId);
                tenant = tdata[0][0][0];

                await setNodeCacheData(tenantId, JSON.stringify(tenant));
            } else {
                tenant = JSON.parse(tenantfromcache);
            }

            let kns = await getNodeCachedData(tenantId + "KnS");
            let apiKey = "";
            let apiSecret = "";

            if (tenant.hasOwnProperty("tenantid")) {
                if (!kns) {
                    apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
                    apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
                    kns = {
                        apiKey: apiKey.Parameter.Value,
                        apiSecret: apiSecret.Parameter.Value,
                    };

                    await setNodeCacheData(tenantId + "KnS", JSON.stringify(kns));
                } else {
                    kns = JSON.parse(kns);
                }
            }

            try {
                let googleres = { data: { success: true } };
                console.log(GOOGLE_RECAPTCHA_URL)
                console.log("Is Valid Domain :", isValidDomain(GOOGLE_RECAPTCHA_URL), GOOGLE_RECAPTCHA_URL);
                // googleres = (isValidDomain(GOOGLE_RECAPTCHA_URL)) ? await axios.post(
                //     `${GOOGLE_RECAPTCHA_URL}/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}&response=${token}`
                // ) : googleres.data.success = false;

                //googleres = await axios.post(`${GOOGLE_RECAPTCHA_URL}/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}&response=${token}`)

                console.log('SIGNUP - Captcha Token Checked :', emailHash);

                if (googleres.data.success) {
                    console.log('SIGNUP - Captcha Token Valid :', emailHash);
                    const client = {};
                    const clientEmail = req.body.clientemail;
                    const isValid = regexPattern.test(clientEmail);
                    if (!isValid) {
                        console.log('SIGNUP - Email Pattern Failed :', emailHash);
                        res.status(400).json({
                            "code": "OWER0001"
                        });
                        return;
                    }
                    client.tenantid = req.body.clienttenantid;
                    client.randomIV = crypto.randomBytes(20).toString('hex');////crypto.randomUUID();
                    const tenant = await tetnantDB.TenantGetContentByID(client.tenantid, req.body.defaultlanguageid);
                    console.log('SIGNUP - Tenant Retrived :', emailHash);
                    try {
                        const result = await tetnantDB.getTenantSignupValues(client.tenantid)
                        console.log('SIGNUP - Tenant Signup Values Retrived :', emailHash);
                        client.username = emailHash;//CryptoJS.HmacSHA3(clientEmail + client.tenantid, DATA_ENCRYPT_KEY).toString();
                        console.log('SIGNUP - Username Ecnrypted with HMAC SHA3 :', emailHash);
                        client.userkey = result[0][0].tenantpromocode + "_" + CryptoJS.SHA3(clientEmail + client.tenantid, { outputLength: 224 }).toString(); //FOR USER KEY
                        console.log('SIGNUP - Userkey Generated :', emailHash);
                        const encryptedData = AESGCMEncryption(clientEmail, client.randomIV)
                        client.email = encryptedData.finalEncrypt;
                        client.authtag = encryptedData.authTag
                        console.log('SIGNUP - Email Encrypted with AES GCM :', emailHash);
                        const encryptedToken = AESGCMEncryption(client.userkey + "_" + crypto.randomBytes(20).toString('hex'), client.randomIV);
                        client.verificationtoken = encodeURIComponent(encryptedToken.finalEncrypt);
                        client.verificationauthtag = encryptedToken.authTag;
                        console.log('SIGNUP - Userkey Encrypted with AED GCM :', emailHash);
                        client.defaultlanguageid = req.body.defaultlanguageid;
                        const clientCount = await clientdb.addClientCount(emailHash);
                        console.log("clientCount ----", JSON.stringify(clientCount))
                        client.externalUserId = result[0][0].tenantpromocode + (1700000000000 + clientCount[0].insertId);

                        console.log("DISPLAY EMAIL : ", req.body.displayemail)
                        client.displayemail = CryptoJS.AES.encrypt(req.body.displayemail, DATA_ENCRYPT_KEY, { iv: client.randomIV }).toString();





                        //crypto.randomBytes(20).toString('hex');
                        console.log('SIGNUP - EUID Generated :', emailHash);
                        const clientres = await clientdb.ClientCreate(client);

                        const qrrefcode = req.cookies["campaign_ref"];
                        console.log("qrrefcode : ", req.cookies)
                        if (qrrefcode) {
                            const qrRef = await clientdb.SetQRRefCode(client.tenantid, client.externalUserId, qrrefcode)
                        }
                        console.log('SIGNUP - Client Created :', emailHash);

                        let payload = {
                            languageId: client.defaultlanguageid,
                            externalUserId: client.externalUserId,
                        };

                        await axios.post(`${PULSE_ID_API}/v2/user/update-default-language`, payload, {
                            headers: {
                                "x-api-key": kns.apiKey,
                                "x-api-secret": kns.apiSecret
                            },
                        });

                        const emailtemplate = JSON.parse(tenant[0][0][0].emailtemplate).SignUp
                        //console.log("EMAIl TEMPLATE : ", emailtemplate)
                        //JSON.parse(fs.readFileSync(`multilingual/emails/signup/${tenant[0][0][0].languagecode}.json`))
                        console.log('SIGNUP - Email Content Retrived :', emailHash);
                        if (clientres[0][0][0].hasOwnProperty("message")) {
                            console.log('SIGNUP - Client Error From DB : ', { "message": clientres[0][0][0].message, "emailHash": emailHash });
                            res.status(200).json({
                                "code": "OWMS0001"
                            });
                            return;
                        } else {
                            try {
                                const emailbody = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                    <html>
                                    <head>
                                    <!--[if gte mso 9]>
                                        <xml>
                                                <o:OfficeDocumentSettings>
                                                <o:AllowPNG/>
                                                <o:PixelsPerInch>96</o:PixelsPerInch>
                                                </o:OfficeDocumentSettings>
                                        </xml>
                                    <![endif]-->
                                    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                    <meta name="format-detection" content="date=no" />
                                    <meta name="format-detection" content="address=no" />
                                    <meta name="format-detection" content="telephone=no" />
                                    <meta name="x-apple-disable-message-reformatting" />
                                    <title>Verification Email</title>

                                      <style type="text/css" media="screen">

                                                .side-gap{
                                                 padding-right: 100px; padding-left: 100px; 
                                                }
                                                 @media only screen and (max-device-width: 480px), only screen and (max-width: 480px) {
                                                .side-gap{
                                                 padding-right: 20px; padding-left: 20px; 
                                                }
                                            }
                                                </style>
                                    </head>
                                    <body>
                                    <table align="center">
                                        <tr>
                                            <td align="center" class="side-gap"
                                                style=" background-color: #091e42; padding-top: 50px; padding-bottom: 50px;">
                                                <table align="center">
                                                    <tr>
                                                        <td style="background-color: white; padding: 25px;">
                                                            <table>
                                                                <tr>
                                                                    <td align="center" style="padding-top: 24px; padding-bottom: 24px;">
                                                                        <img src="${CLOUD_FRONT}${tenant[0][0][0].tenantlogo}" alt="visa"
                                                                            style="width:75px;">
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="display: block; font-size: 20px; font-weight: bold; font-family: Verdana,Geneva,Tahoma,sans-serif;">
                                                                        ${emailtemplate.Body.Title}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding-bottom: 16px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 16px; padding-bottom: 16px;">
                                                                        ${emailtemplate.Body.Paragraph1}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center">
                                                                        <table align="center">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td>
                                                                                        <span
                                                                                            style="display:inline-block;border-radius:0px;background-color:#091e42">
                                                                                            <a href="${HOST_URL}/${result[0][0].tenanturlname}/verify/${client.verificationtoken}"
                                                                                                style="border-top:13px solid;border-bottom:13px solid;border-right:24px solid;border-left:24px solid;border-color:#091e42;border-radius:0px;
                                                                                                                          background-color:#091e42;color:#ffffff;font-size:16px;line-height:18px;word-break:break-word;font-weight:bold;font-size:14px;border-top:20px solid;
                                                                                                                          border-bottom:20px solid;border-color:#091e42;line-height:14px;letter-spacing:0.8px;text-transform:uppercase;box-sizing:border-box;display:inline-block;
                                                                                                                          text-align:center;font-weight:900;text-decoration:none!important"
                                                                                                target="_blank">
                                                                                                ${emailtemplate.Body.Button}
                                                                                            </a>
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding-bottom: 48px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;;">
                                                                        ${emailtemplate.Body.CopyLinkText}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="font-size: 13; font-family: monospace; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                        ${HOST_URL}/${result[0][0].tenanturlname}/verify/${client.verificationtoken}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td
                                                                        style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px;">
                                                                        ${emailtemplate.Body.Paragraph2}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td
                                                                        style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                        ${(emailtemplate.Body.Footer === "") ? "" : `${emailtemplate.Body.Footer}, <br/>`}
                                                                        ${emailtemplate.Body.FooterFrom}
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                
                                </html>`
                                console.log('SIGNUP - Generated Email Template :', emailHash);
                                emailClient({
                                    from: "visajapan@offers-exchange.com",
                                    to: req.body.displayemail + "@" + clientEmail.split("@")[1],
                                    subject: emailtemplate.Subject,
                                    html: emailbody
                                })
                                console.log('SIGNUP - Email Sent :', emailHash);

                                console.log('SIGNUP - SignUp Success :', emailHash);
                                res.status(200).json({
                                    "code": "OWMS0001"
                                });
                                client.tenanturlname = result[0][0].tenanturlname;
                                const { randomIV, ...clientMod } = client;

                                await auditLog.addAduditLogs(component, "ClientCreate", clientMod, "POST", clientres[0][0][0].clientid, clientres[0][0][0].clientid, client.tenantid);
                                console.log('SIGNUP - Audit Insert Done :', emailHash);
                                return;
                            } catch (er) {
                                console.log('SIGNUP - Email Failed : ', { "error": er, "emailHash": emailHash });
                                res.status(400).json({
                                    "code": "OWER0001"
                                });
                                return;
                            }


                        }

                    } catch (err) {
                        console.log('SIGNUP - SignUp Error : ', { "error": err, "emailHash": emailHash });
                        res.status(400).json({
                            "code": "OWER0001"
                        });
                        return;
                    }
                } else {
                    console.log('SIGNUP - Captcha Token Invalid :', emailHash);
                    res.status(400).json({
                        "code": "OWER0001"
                    });
                    return;
                }
            } catch (error) {
                console.log('SIGNUP - Capthca Token Check Failed : ', { "error": error, "emailHash": emailHash });
                res.status(400).json({
                    "code": "OWER0002"
                });
                return;
            }
        } else {
            console.log('SIGNUP - Capthca Token Already Used Within Last 5 Minutes.', emailHash);
            res.status(400).json({
                "code": "OWER0003"
            });
            return;
        }
    } else {
        console.log('SIGNUP - Cpatcha Token Empty');
        res.status(400).json({
            "code": "OWER0004"
        });
        return;
    }
}

exports.ClientLogin = async (req, res, next) => {
    console.log('SIGNIN - IN');
    const audit = {};
    const token = req.body.captchatoken;

    let isExist = false;
    let now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    // for (let i = 0, j = captchatokens.length; i < j; i++) {
    //     if (captchatokens[i]?.token === token) {
    //         isExist = true;
    //         // break;
    //     }
    //     if (captchatokens[i]?.time < now) {
    //         captchatokens.splice(i, 1);
    //     }
    // }
    const clientEmail = req.body.clientemail;
    const isValid = regexPattern.test(clientEmail);

    const tenantId = req.body.clienttenantid;

    const clientusername = CryptoJS.HmacSHA3(clientEmail + tenantId, DATA_ENCRYPT_KEY).toString();
    if (!isValid) {
        console.log('SIGNIN - Email Pattern Failed : ', clientusername);
        res.status(400).json({
            "code": "OWER0001"
        });
    } else {
        console.log('SIGNIN - Email Pattern Valid');


        if (token !== "") {
            console.log('SIGNIN - Captcha Token Available: ', clientusername);
            if (!isExist) {
                console.log('SIGNIN - Captcha Token is New: ', clientusername);
                captchatokens.push({ token, time: new Date() });


                try {
                    let googleres = { data: { success: true } };
                    console.log("Is Valid Domain :", isValidDomain(GOOGLE_RECAPTCHA_URL));
                    console.log(GOOGLE_RECAPTCHA_URL)
                    // googleres = (isValidDomain(GOOGLE_RECAPTCHA_URL)) ? await axios.post(
                    //     `${GOOGLE_RECAPTCHA_URL}/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}&response=${token}`
                    // ) : googleres.data.success = false;

                    //googleres = await axios.post(`${GOOGLE_RECAPTCHA_URL}/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}&response=${token}`)

                    console.log('SIGNIN - Captcha Token Checked', googleres);
                    if (googleres.data.success) {
                        console.log('SIGNIN - Captcha Token Valid');
                        try {

                            const result = await clientdb.ClientLogin(clientusername, tenantId);
                            console.log('SIGNIN - Check Client in DB: ', clientusername);
                            if (result[0][0].length > 0) {
                                console.log('SIGNIN - Client Exist: ', clientusername);
                                if (result[0][0][0].issignupcomplete === "1") {
                                    console.log('SIGNIN - Client has Completed Signup Process');
                                    const encryptedToken = AESGCMEncryption(result[0][0][0].userkey + "_" + crypto.randomBytes(20).toString('hex'), result[0][0][0].clientIV);
                                    console.log('SIGNIN - Generate SignIn Verify Token with AES GCM');
                                    const verificationToken = encodeURIComponent(encryptedToken.finalEncrypt);
                                    console.log('SIGNIN - Encoding SignIn Verify Token');
                                    const tokenUpdateRes = await clientdb.clientTokenUpdate(verificationToken, encryptedToken.authTag, result[0][0][0].clientid, tenantId)
                                    console.log('SIGNIN - Updated SignIn Verify Token in DB');
                                    const decryptedEmail = AESGCMDecryption(result[0][0][0].email, result[0][0][0].authtag, result[0][0][0].clientIV)
                                    console.log('SIGNIN - Email Address Decrypted');
                                    const tenant = await tetnantDB.TenantGetContentByID(tenantId, req.body.defaultlanguageid); //result[0][0][0].defaultlanguageid);
                                    console.log('SIGNIN - Tenant Retrived');
                                    const emailtemplate = JSON.parse(tenant[0][0][0].emailtemplate).SignIn;


                                    let displayemail
                                    if (result[0][0][0].displayemail) {
                                        displayemail = CryptoJS.AES.decrypt(result[0][0][0].displayemail, DATA_ENCRYPT_KEY, { iv: result[0][0][0].clientIV }).toString(CryptoJS.enc.Utf8);
                                    } else {
                                        displayemail = req.body.displayemail;
                                    }

                                    //console.log("EMAIl TEMPLATE : ", tenant[0][0][0])
                                    //JSON.parse(fs.readFileSync(`multilingual/emails/signin/${tenant[0][0][0].languagecode}.json`))
                                    console.log('SIGNIN - Email Content Retrived: ', clientusername);
                                    if (tokenUpdateRes[0].affectedRows !== 0) {
                                        console.log('SIGNIN - Verify Token Updated Successfuly');
                                        try {
                                            await emailClient({
                                                from: "visajapan@offers-exchange.com",
                                                to: displayemail + "@" + decryptedEmail.split("@")[1],
                                                subject: emailtemplate.Subject,
                                                html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                                <html>
                                                <head>
                                                <!--[if gte mso 9]>
                                                    <xml>
                                                            <o:OfficeDocumentSettings>
                                                            <o:AllowPNG/>
                                                            <o:PixelsPerInch>96</o:PixelsPerInch>
                                                            </o:OfficeDocumentSettings>
                                                    </xml>
                                                <![endif]-->
                                                <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
                                                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                                                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                                <meta name="format-detection" content="date=no" />
                                                <meta name="format-detection" content="address=no" />
                                                <meta name="format-detection" content="telephone=no" />
                                                <meta name="x-apple-disable-message-reformatting" />
                                                <title>Verification Email</title>

                                                <style type="text/css" media="screen">

                                                .side-gap{
                                                 padding-right: 100px; padding-left: 100px; 
                                                }
                                                 @media only screen and (max-device-width: 480px), only screen and (max-width: 480px) {
                                                .side-gap{
                                                 padding-right: 20px; padding-left: 20px; 
                                                }
                                            }
                                                </style>
                                                </head>
                                                <body>
                                                      <table align="center">
                                                            <tr>
                                                                  <td align="center" class="side-gap"
                                                                        style=" background-color: #091e42; padding-top: 50px; padding-bottom: 50px;">
                                                                        <table align="center">
                                                                              <tr>
                                                                                    <td style="background-color: white; padding: 25px;">
                                                                                          <table>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="padding-top: 24px; padding-bottom: 24px;">
                                                                                                            <img src="${CLOUD_FRONT}${tenant[0][0][0].tenantlogo}"
                                                                                                                  alt="visa" style="width:75px;">
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="display: block; font-size: 20px; font-weight: bold; font-family: Verdana,Geneva,Tahoma,sans-serif;">
                                                                                                            ${emailtemplate.Body.Title}</td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="padding-bottom: 16px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 16px; padding-bottom: 16px;">
                                                                                                            ${emailtemplate.Body.Paragraph1}
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center">
                                                                                                            <table align="center">
                                                                                                                  <tbody>
                                                                                                                        <tr>
                                                                                                                              <td>
                                                                                                                                    <span
                                                                                                                                          style="display:inline-block;border-radius:0px;background-color:#091e42">
                                                                                                                                          <a href="${HOST_URL}/${result[0][0][0].tenanturlname}/verify/${verificationToken}"
                                                                                                                                                style="border-top:13px solid;border-bottom:13px solid;border-right:24px solid;border-left:24px solid;border-color:#091e42;border-radius:0px;
                                                                                                                                          background-color:#091e42;color:#ffffff;font-size:16px;line-height:18px;word-break:break-word;font-weight:bold;font-size:14px;border-top:20px solid;
                                                                                                                                          border-bottom:20px solid;border-color:#091e42;line-height:14px;letter-spacing:0.8px;text-transform:uppercase;box-sizing:border-box;display:inline-block;
                                                                                                                                          text-align:center;font-weight:900;text-decoration:none!important"
                                                                                                                                                target="_blank">
                                                                                                                                                ${emailtemplate.Body.Button}
                                                                                                                                          </a>
                                                                                                                                    </span>
                                                                                                                              </td>
                                                                                                                        </tr>
                                                                                                                  </tbody>
                                                                                                            </table>
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="padding-bottom: 48px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;;">
                                                                                                            ${emailtemplate.Body.CopyLinkText}
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="font-size: 13; font-family: monospace; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                                                            ${HOST_URL}/${result[0][0][0].tenanturlname}/verify/${verificationToken}
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td
                                                                                                            style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px;">
                                                                                                            ${emailtemplate.Body.Paragraph2}
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td
                                                                                                            style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                                                            ${(emailtemplate.Body.Footer === "") ? "" : `${emailtemplate.Body.Footer}, <br/>`}
                                                                                                            ${emailtemplate.Body.FooterFrom}
                                                                                                      </td>
                                                                                                </tr>
                                                                                          </table>
                                                                                    </td>
                                                                              </tr>
                                                                        </table>
                                                                  </td>
                                                            </tr>
                                                      </table>
                                                </body>
                                                
                                                </html>`
                                            });
                                            console.log('SIGNIN - Email Sent: ', clientusername);

                                        } catch (er) {
                                            console.log('SIGNIN - Email Failed : ', { "error": er, "clientusername": clientusername });
                                            res.status(400).json({
                                                "code": "OWER0001"
                                            });
                                        }

                                        console.log('SIGNIN - SignUp Success');
                                        res.status(200).json({
                                            "code": "OWMS0002"
                                        });
                                        audit.email = result[0][0][0].email
                                        audit.clientid = result[0][0][0].clientid
                                        audit.tenanturlname = result[0][0][0].tenanturlname
                                        audit.verificationtoken = verificationToken
                                        await auditLog.addAduditLogs(component, "ClientLogin", audit, "POST", result[0][0][0].clientid, result[0][0][0].clientid, tenantId)
                                        console.log('SIGNIN - Audit Insert Done');
                                    }
                                } else {
                                    console.log('SIGNIN - Client Signup Process Not Completd :', clientusername);
                                    res.status(200).json({
                                        "code": "OWMS0002"
                                    });
                                }
                            } else {
                                console.log('SIGNIN - Client Does not Exist :', clientusername);
                                res.status(200).json({
                                    "code": "OWMS0002"
                                });
                            }

                        } catch (err) {
                            console.log('SIGNIN - Signin Error : ', { "error": err, "clientusername": clientusername });
                            res.status(400).json({
                                "code": "OWER0001"
                            });
                        }
                    } else {
                        console.log('SIGNIN - Audit Insert Done');
                        await auditLog.addAduditLogs(component, "ClientLogin", "Fail Attempt to Login", "POST", clientusername, clientusername, tenantId);
                        res.status(400).json({
                            "code": "OWER0001"
                        });
                    }
                } catch (error) {
                    console.log('SIGNIN - Capthca Token Check Failed : ', error);
                    await auditLog.addAduditLogs(component, "ClientLogin", "Captcha Failed", "POST", clientusername, clientusername, tenantId);
                    res.status(400).json({
                        "code": "OWER0002"
                    });

                }
            } else {
                console.log('SIGNIN - Capthca Token Already Used Within Last 5 Minutes.');
                await auditLog.addAduditLogs(component, "ClientLogin", "Exceeded reuqest limit", "POST", clientusername, clientusername, tenantId);
                res.status(400).json({
                    "code": "OWER0003"
                });
            }
        } else {
            console.log('SIGNIN - Cpatcha Token Empty');
            await auditLog.addAduditLogs(component, "ClientLogin", "Invalid capthca token", "POST", clientusername, clientusername, tenantId);
            res.status(400).json({
                "code": "OWMS0004"
            });
        }
    }
}

exports.ClientVerification = async (req, res, next) => {
    console.log('CLIENT VERIFICATION - IN');
    const clientToken = req.body.clienttoken;
    const isChange = req.body.ischange
    try {

        const client = await clientdb.tokenVerification(clientToken);
        console.log('CLIENT VERIFICATION - Check Verify Token in DB : ', client[0][0]);

        if (client[0][0].length > 0) {
            console.log('CLIENT VERIFICATION - Verify Token Exist');
            const clientObj = client[0][0][0]
            console.log(clientObj)
            let { clientid, email, userkey, tenantid, tokenexpiry, verificationtoken, defaultlanguageid, externaluserid,
                isenrolled, languagecode, visaclientid, pulse_euid, authtag, clientIV, tenanturlname, displayemail, tenantname, cardnumber } = clientObj;

            console.log("tokenexpiry :", tokenexpiry)
            if (tokenexpiry > 5 || verificationtoken !== clientToken) {
                console.log('CLIENT VERIFICATION - Verify Token Expired or Not Match');
                res.status(200).json("Your verification URL is expired! please try again!");
                await auditLog.addAduditLogs(component, "ClientVerification", "Client Verification URL is expired", "POST", clientid, clientid, tenantid);

            } else {

                let decryptedEmail = AESGCMDecryption(email, authtag, clientIV)

                const decryptedEmailOld = decryptedEmail;

                let displaEmailOld = "";
                if (displayemail) {
                    displaEmailOld = CryptoJS.AES.decrypt(displayemail, DATA_ENCRYPT_KEY, { iv: clientIV }).toString(CryptoJS.enc.Utf8);// + "@" + decryptedEmail.split("@")[1];
                } else {
                    displaEmailOld = decryptedEmailOld.split("@")[0];
                }


            
                console.log("BEFORE is Change", isChange)
                if (isChange) {
                    console.log("IN is Change", isChange)

                    const newClient = await clientdb.UpdateClientEmailVerified({ clientid, tenantid })

                    console.log("IN is Change new client", newClient)


                    email = newClient[0][0].newemail
                    authtag = newClient[0][0].newauthtag
                    username = newClient[0][0].newusername
                    displayemail = newClient[0][0].newdisplayemail;


                    console.log("IN is Change new client", email, authtag, username, displayemail)


                    decryptedEmail = AESGCMDecryption(email, authtag, clientIV)

                    if (cardnumber) {
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
                        const emailchange = await axios.post(PULSE_ID_API + "/user/update-email",
                            {
                                externalUserId: externaluserid,
                                emailAddress: decryptedEmail
                            },
                            {
                                headers: {
                                    "x-api-key": kns.apiKey,
                                    "x-api-secret": kns.apiSecret
                                }
                            }
                        );
                    }

                    try {
                        const tenant = await tetnantDB.TenantGetContentByID(tenantid, defaultlanguageid); //result[0][0][0].defaultlanguageid);
                        console.log('Verification - Tenant Retrived', displaEmailOld + "@" + decryptedEmailOld.split("@")[1]);
                        const emailtemplate = JSON.parse(tenant[0][0][0].emailtemplate).emailchange_notification;
                        await emailClient({
                            from: "visajapan@offers-exchange.com",
                            to: displaEmailOld + "@" + decryptedEmailOld.split("@")[1],
                            subject: emailtemplate.Subject,
                            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                                                <html>
                                                <head>
                                                <!--[if gte mso 9]>
                                                    <xml>
                                                            <o:OfficeDocumentSettings>
                                                            <o:AllowPNG/>
                                                            <o:PixelsPerInch>96</o:PixelsPerInch>
                                                            </o:OfficeDocumentSettings>
                                                    </xml>
                                                <![endif]-->
                                                <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
                                                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                                                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                                <meta name="format-detection" content="date=no" />
                                                <meta name="format-detection" content="address=no" />
                                                <meta name="format-detection" content="telephone=no" />
                                                <meta name="x-apple-disable-message-reformatting" />
                                                <title>Verification Email</title>

                                                <style type="text/css" media="screen">

                                                .side-gap{
                                                 padding-right: 100px; padding-left: 100px; 
                                                }
                                                 @media only screen and (max-device-width: 480px), only screen and (max-width: 480px) {
                                                .side-gap{
                                                 padding-right: 20px; padding-left: 20px; 
                                                }
                                            }
                                                </style>
                                                </head>
                                                <body>
                                                      <table align="center">
                                                            <tr>
                                                                  <td align="center" class="side-gap"
                                                                        style=" background-color: #091e42; padding-top: 50px; padding-bottom: 50px;">
                                                                        <table align="center">
                                                                              <tr>
                                                                                    <td style="background-color: white; padding: 25px;">
                                                                                          <table>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="padding-top: 24px; padding-bottom: 24px;">
                                                                                                            <img src="${CLOUD_FRONT}${tenant[0][0][0].tenantlogo}"
                                                                                                                  alt="visa" style="width:75px;">
                                                                                                      </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                      <td align="center"
                                                                                                            style="padding-bottom: 16px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 16px; padding-bottom: 16px;">
                                                                                                            ${emailtemplate.Body.content}
                                                                                                      </td>
                                                                                                </tr>
                                                                                               
                                                                                          </table>
                                                                                    </td>
                                                                              </tr>
                                                                        </table>
                                                                  </td>
                                                            </tr>
                                                      </table>
                                                </body>
                                                
                                                </html>`
                        });
                        console.log('Email Change - Email Sent: ');

                    } catch (er) {
                        console.log('Email Change - Email Failed : ', { "error": er });

                    }
                }
                const accessToken = generateAccessToken(clientid, userkey, tenantid, externaluserid);
                const refreshToken = generateRefreshToken(clientid, userkey, tenantid, externaluserid);
                console.log('CLIENT VERIFICATION - Access and Refresh Token Generated');
                //await clientdb.AddTokens(accessToken, refreshToken);
                console.log('CLIENT VERIFICATION - Access and Refresh Tokens Added to DB');
                await clientdb.invalidateClientToken(clientid, tenantid);
                console.log('CLIENT VERIFICATION - Invalidate Existing Verify Token');
                await clientdb.verifyAccount(clientid, tenantid)

                console.log('CLIENT VERIFICATION - Complete SignUp Process');
                console.log('CLIENT VERIFICATION - Verification Success', displayemail);


                await setRedisCacheData(accessToken, accessToken);
                await setRedisCacheData(refreshToken, refreshToken);

                let demail = "";
                if (displayemail) {
                    console.log("IN display email", displayemail)

                    demail = CryptoJS.AES.decrypt(displayemail, DATA_ENCRYPT_KEY, { iv: clientIV }).toString(CryptoJS.enc.Utf8);// + "@" + decryptedEmail.split("@")[1];
                    console.log("IN display email2", demail)

                } else {
                    demail = decryptedEmail.split("@")[0];
                    console.log("IN display email else", demail)

                }

                res.status(202)
                    .cookie("at", accessToken, {
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
                    .cookie("rt", refreshToken, {
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
                    .cookie("ow-c", {
                        clientid,
                        defaultlanguageid,
                        externaluserid,
                        isenrolled,
                        languagecode,
                        tenantid,
                        tenanturlname,
                        tenantname,
                        visaclientid,
                        pulse_euid,
                        domain: HOST_DOMAIN,
                        emailaddress: decryptedEmail,
                        displayemail: demail,
                        sessionid: crypto.randomUUID(),
                        sessionstart: new Date()
                    }, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .json({
                        clientid,
                        defaultlanguageid,
                        externaluserid,
                        isenrolled,
                        languagecode,
                        tenantid,
                        visaclientid,
                        pulse_euid,
                        domain: HOST_DOMAIN,
                        emailaddress: decryptedEmail,
                        displayemail: demail
                    });

                await auditLog.addAduditLogs(component, "ClientVerification", "Client Verification Successfull", "POST", clientid, clientid, tenantid);
                console.log('CLIENT VERIFICATION - Audit Insert Done');
            }
        } else {
            console.log('CLIENT VERIFICATION - Invalid Verify Token');
            res.status(400).json("OWER0005");
        }
    } catch (error) {
        console.log('CLIENT VERIFICATION - Verification Failed : ', error);
        res.status(400).json(error);
        await auditLog.addAduditLogs(component, "ClientVerification", "Client Verification Failed, " + error, "POST", null, null, req.body.tenantid);
    }
}

exports.updateClientLanguage = async (req, res, next) => {
    const clientId = req.body.clientid;
    const tenantId = req.body.tenantid;
    const languageId = req.body.languageid;

    const tenantfromcache = await getNodeCachedData(tenantId);
    let tenant;

    if (!tenantfromcache) {
        const tdata = await tetnantDB.TenantGetByID(tenantId);
        tenant = tdata[0][0][0];

        await setNodeCacheData(tenantId, JSON.stringify(tenant));
    } else {
        tenant = JSON.parse(tenantfromcache);
    }

    let kns = await getNodeCachedData(tenantId + "KnS");
    let apiKey = "";
    let apiSecret = "";

    if (tenant.hasOwnProperty("tenantid")) {
        if (!kns) {
            apiKey = await GetParametersFromAWS(tenant.tenantapikeyname);
            apiSecret = await GetParametersFromAWS(tenant.tenantapisecretname);
            kns = {
                apiKey: apiKey.Parameter.Value,
                apiSecret: apiSecret.Parameter.Value,
            };

            await setNodeCacheData(tenantId + "KnS", JSON.stringify(kns));
        } else {
            kns = JSON.parse(kns);
        }
    }

    const client = await getClient(req);
    let euid = undefined;
    if (client) {
        euid = client.externaluserid;
    }

    let payload = {
        languageId: languageId,
        externalUserId: euid ? euid : null,
    };

    try {
        console.log("updateClientLanguageeeeeeeeeeeee : ", payload);
        const client = await clientdb.updateClientLanguage(
            clientId,
            tenantId,
            languageId
        );

        await axios.post(`${PULSE_ID_API}/v2/user/update-default-language`, payload, {
            headers: {
                "x-api-key": kns.apiKey,
                "x-api-secret": kns.apiSecret
            },
        });

        res.status(200).json(client[0][0]);

        await auditLog.addAduditLogs(
            component,
            "updateClientLanguage",
            req.body,
            "POST",
            clientId,
            clientId,
            tenantId
        );

    } catch (error) {
        console.log(
            "updateClientLanguage - Error in updating client language: ", error
        );
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getMagicVerifyToken = async (req, res, next) => {
    const clientEUID = req.body.externaluserid;
    const tenantId = req.body.tenantid;
    const campaignId = req.body.campaignId;
    // const languageId = req.body.languageid;


    try {
        // console.log("verifytoken magic : ", req.body)
        const result = await clientdb.getClientByEUID(clientEUID, tenantId);
        console.log("MAGIC CLient : ", result[0][0])

        const encryptedToken = AESGCMEncryption(result[0][0].userkey + "_" + crypto.randomBytes(20).toString('hex'), result[0][0].clientIV);
        console.log('GAMIFICATION - Generate Magic Verify Token with AES GCM');
        const verificationToken = encodeURIComponent(encryptedToken.finalEncrypt);
        console.log('GAMIFICATION - Encoding Magic Verify Token');
        await clientdb.clientMagicTokenUpdate(verificationToken, encryptedToken.authTag, result[0][0].clientid, tenantId)

        console.log("MAGIC CLient Token : ", {
            magiclink: `${HOST_URL}/${result[0][0].tenanturlname}/verify/${verificationToken}/${campaignId}`
        })


        res.status(200).json({
            magiclink: `${HOST_URL}/${result[0][0].tenanturlname}/verify/${verificationToken}/${campaignId}`
        });
        // await auditLog.addAduditLogs(component, "updateClientLanguage", req.body, "POST", clientId, clientId, tenantId)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.verifyMagicToken = async (req, res, next) => {
    console.log('CLIENT MAGIC VERIFICATION - IN');
    const clientToken = req.body.clienttoken;
    try {

        const client = await clientdb.magicTokenVerification(clientToken);
        console.log('CLIENT MAGIC VERIFICATION - Check Verify Token in DB : ', client[0][0]);

        if (client[0][0].length > 0) {
            console.log('CLIENT MAGIC VERIFICATION - Verify Token Exist');
            const clientObj = client[0][0][0]
            console.log(clientObj)
            const { clientid, email, userkey, tenantid, tokenexpiry, verifytoken2, defaultlanguageid, externaluserid,
                isenrolled, languagecode, visaclientid, pulse_euid, authtag, clientIV, tenanturlname, displayemail } = clientObj;

            console.log("tokenexpiry :", tokenexpiry)
            if (tokenexpiry > 5 || verifytoken2 !== clientToken) {
                console.log('CLIENT MAGIC VERIFICATION - Verify Token Expired or Not Match');
                res.status(200).json("Your verification URL is expired! please try again!");
                await auditLog.addAduditLogs(component, "ClientVerification", "Client MAGIC Verification URL is expired", "POST", clientid, clientid, tenantid);

            } else {
                const accessToken = generateAccessToken(clientid, userkey, tenantid, externaluserid);
                const refreshToken = generateRefreshToken(clientid, userkey, tenantid, externaluserid);
                console.log('CLIENT MAGIC VERIFICATION - Access and Refresh Token Generated');
                //await clientdb.AddTokens(accessToken, refreshToken);
                console.log('CLIENT MAGIC VERIFICATION - Access and Refresh Tokens Added to DB');
                await clientdb.invalidateMagicToken(clientid, tenantid);
                console.log('CLIENT MAGIC VERIFICATION - Invalidate Existing Verify Token');
                // await clientdb.verifyAccount(clientid, tenantid)
                console.log('CLIENT MAGIC VERIFICATION - Complete SignUp Process');
                console.log('CLIENT MAGIC VERIFICATION - Verification Success');


                await setRedisCacheData(accessToken, accessToken);
                await setRedisCacheData(refreshToken, refreshToken);

                const decryptedEmail = AESGCMDecryption(email, authtag, clientIV)
                console.log("displayemail : ", displayemail)
                let demail = "";
                if (displayemail) {
                    demail = CryptoJS.AES.decrypt(displayemail, DATA_ENCRYPT_KEY, { iv: clientIV }).toString(CryptoJS.enc.Utf8);
                } else {
                    demail = decryptedEmail.split("@")[0];
                }

                res.status(202)
                    .cookie("at", accessToken, {
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
                    .cookie("rt", refreshToken, {
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
                    .cookie("ow-c", {
                        clientid,
                        defaultlanguageid,
                        externaluserid,
                        isenrolled,
                        languagecode,
                        tenantid,
                        tenanturlname,
                        visaclientid,
                        pulse_euid,
                        domain: HOST_DOMAIN,
                        emailaddress: decryptedEmail,
                        displayemail: demail,
                        sessionid: crypto.randomUUID(),
                        sessionstart: new Date()

                    }, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .json({
                        clientid,
                        defaultlanguageid,
                        externaluserid,
                        isenrolled,
                        languagecode,
                        tenantid,
                        visaclientid,
                        pulse_euid,
                        domain: HOST_DOMAIN,
                        emailaddress: decryptedEmail,
                        displayemail: demail,
                        sessionid: crypto.randomUUID(),
                        sessionstart: new Date()
                    });

                await auditLog.addAduditLogs(component, "ClientVerification", "Client MAGIC Verification Successfull", "POST", clientid, clientid, tenantid);
                console.log('CLIENT MAGIC VERIFICATION - Audit Insert Done');
            }
        } else {
            console.log('CLIENT MAGIC VERIFICATION - Invalid Verify Token');
            res.status(400).json("OWER0005");
        }
    } catch (error) {
        console.log('CLIENT MAGIC VERIFICATION - Verification Failed : ', error);
        res.status(400).json(error);
        await auditLog.addAduditLogs(component, "ClientVerification", "Client MAGIC Verification Failed, " + error, "POST", null, null, req.body.tenantid);
    }
}

exports.updateEmail = async (req, res, next) => {
    const tenantId = req.body.tenantid;
    const newEmail = req.body.newemail;
    const newDisplayEmail = req.body.newdisplayemail;
    const tokenclient = req.cookies["ow-c"];
    const clientid = tokenclient.clientid;
    const clientemail = tokenclient.emailaddress;

    console.log("CLIENT............... : ", tenantId, newEmail,
        CryptoJS.HmacSHA3(newEmail + tenantId, DATA_ENCRYPT_KEY).toString(),
        CryptoJS.HmacSHA3(clientemail + tenantId, DATA_ENCRYPT_KEY).toString());
    // console.log("CLIENT EMAIL............... : ", tokenclient.emailaddress, newEmail, newDisplayEmail);

    try {
        const isValid = regexPattern.test(newEmail);
        if (!isValid) {
            console.log('CHANGE EMAIL - Email Pattern Failed :');
            res.status(400).json({
                "code": "OWER0001"
            });
            return;
        }

        const newClient = {}

        const newusername = CryptoJS.HmacSHA3(newEmail + tenantId, DATA_ENCRYPT_KEY).toString();
        const clientres = await clientdb.GetUSerByUsername({ newusername, tenantId });

        console.log("CLEINT WITH NEW USER NAME : ", clientres)
        if (clientres[0].length === 0) {
            const clientusername = CryptoJS.HmacSHA3(clientemail + tenantId, DATA_ENCRYPT_KEY).toString();
            const result = await clientdb.ClientLogin(clientusername, tenantId);

            // console.log("CLIENT LOGIN RESULT : ", result[0][0][0])

            const encryptedData = AESGCMEncryption(newEmail, result[0][0][0].clientIV)
            newClient.email = encryptedData.finalEncrypt;
            newClient.authtag = encryptedData.authTag;
            newClient.username = newusername;
            newClient.displayemail = CryptoJS.AES.encrypt(newDisplayEmail, DATA_ENCRYPT_KEY, { iv: result[0][0][0].clientIV }).toString();
            newClient.clientid = clientid;
            newClient.tenantid = tenantId;
            await clientdb.UpdateClientEmailTemp(newClient)

            const encryptedToken = AESGCMEncryption(result[0][0][0].userkey + "_" + crypto.randomBytes(20).toString('hex'), result[0][0][0].clientIV);
            console.log('CHANGE EMAIL - Generate SignIn Verify Token with AES GCM');
            const verificationToken = encodeURIComponent(encryptedToken.finalEncrypt);
            console.log('CHANGE EMAIL - Encoding SignIn Verify Token');
            const tokenUpdateRes = await clientdb.clientTokenUpdate(verificationToken, encryptedToken.authTag, result[0][0][0].clientid, tenantId)
            console.log('CHANGE EMAIL - Updated SignIn Verify Token in DB');
            // const decryptedEmail = AESGCMDecryption(result[0][0][0].email, result[0][0][0].authtag, result[0][0][0].clientIV)
            console.log('CHANGE EMAIL - Email Address Decrypted');
            const tenant = await tetnantDB.TenantGetContentByID(tenantId, result[0][0][0].defaultlanguageid); //result[0][0][0].defaultlanguageid);
            console.log('CHANGE EMAIL - Tenant Retrived');
            const emailtemplate = JSON.parse(tenant[0][0][0].emailtemplate).SignIn;


            if (tokenUpdateRes[0].affectedRows !== 0) {
                console.log('CHANGE EMAIL - Verify Token Updated Successfuly');
                try {
                    await emailClient({
                        from: "visajapan@offers-exchange.com",
                        to: newDisplayEmail + "@" + newEmail.split("@")[1],
                        subject: emailtemplate.Subject,
                        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html>
                    <head>
                    <!--[if gte mso 9]>
                        <xml>
                                <o:OfficeDocumentSettings>
                                <o:AllowPNG/>
                                <o:PixelsPerInch>96</o:PixelsPerInch>
                                </o:OfficeDocumentSettings>
                        </xml>
                    <![endif]-->
                    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="format-detection" content="date=no" />
                    <meta name="format-detection" content="address=no" />
                    <meta name="format-detection" content="telephone=no" />
                    <meta name="x-apple-disable-message-reformatting" />
                    <title>Verification Email</title>

                      <style type="text/css" media="screen">

                                                .side-gap{
                                                 padding-right: 100px; padding-left: 100px; 
                                                }
                                                 @media only screen and (max-device-width: 480px), only screen and (max-width: 480px) {
                                                .side-gap{
                                                 padding-right: 20px; padding-left: 20px; 
                                                }
                                            }
                                                </style>

                    </head>
                    <body>
                          <table align="center">
                                <tr>
                                      <td align="center" class="side-gap"
                                            style=" background-color: #091e42; padding-top: 50px; padding-bottom: 50px;">
                                            <table align="center">
                                                  <tr>
                                                        <td style="background-color: white; padding: 25px;">
                                                              <table>
                                                                    <tr>
                                                                          <td align="center"
                                                                                style="padding-top: 24px; padding-bottom: 24px;">
                                                                                <img src="${CLOUD_FRONT}${tenant[0][0][0].tenantlogo}"
                                                                                      alt="visa" style="width:75px;">
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td align="center"
                                                                                style="display: block; font-size: 20px; font-weight: bold; font-family: Verdana,Geneva,Tahoma,sans-serif;">
                                                                                ${emailtemplate.Body.Title}</td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td align="center"
                                                                                style="padding-bottom: 16px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 16px; padding-bottom: 16px;">
                                                                                ${emailtemplate.Body.Paragraph1}
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td align="center">
                                                                                <table align="center">
                                                                                      <tbody>
                                                                                            <tr>
                                                                                                  <td>
                                                                                                        <span
                                                                                                              style="display:inline-block;border-radius:0px;background-color:#091e42">
                                                                                                              <a href="${HOST_URL}/${result[0][0][0].tenanturlname}/verify/${verificationToken}/ec/change"
                                                                                                                    style="border-top:13px solid;border-bottom:13px solid;border-right:24px solid;border-left:24px solid;border-color:#091e42;border-radius:0px;
                                                                                                              background-color:#091e42;color:#ffffff;font-size:16px;line-height:18px;word-break:break-word;font-weight:bold;font-size:14px;border-top:20px solid;
                                                                                                              border-bottom:20px solid;border-color:#091e42;line-height:14px;letter-spacing:0.8px;text-transform:uppercase;box-sizing:border-box;display:inline-block;
                                                                                                              text-align:center;font-weight:900;text-decoration:none!important"
                                                                                                                    target="_blank">
                                                                                                                    ${emailtemplate.Body.Button}
                                                                                                              </a>
                                                                                                        </span>
                                                                                                  </td>
                                                                                            </tr>
                                                                                      </tbody>
                                                                                </table>
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td align="center"
                                                                                style="padding-bottom: 48px; font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;;">
                                                                                ${emailtemplate.Body.CopyLinkText}
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td align="center"
                                                                                style="font-size: 13; font-family: monospace; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                                ${HOST_URL}/${result[0][0][0].tenanturlname}/verify/${verificationToken}/ec/change
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td
                                                                                style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px;">
                                                                                ${emailtemplate.Body.Paragraph2}
                                                                          </td>
                                                                    </tr>
                                                                    <tr>
                                                                          <td
                                                                                style="font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222; padding-top: 24px; padding-bottom: 24px;">
                                                                                ${(emailtemplate.Body.Footer === "") ? "" : `${emailtemplate.Body.Footer}, <br/>`}
                                                                                ${emailtemplate.Body.FooterFrom}
                                                                          </td>
                                                                    </tr>
                                                              </table>
                                                        </td>
                                                  </tr>
                                            </table>
                                      </td>
                                </tr>
                          </table>
                    </body>
                    
                    </html>`
                    });
                    console.log('CHNAGE EMAIL - Email Sent: ');

                } catch (er) {
                    console.log('CHANGE EMAIL - Email Failed : ', { "error": er });
                    res.status(400).json({
                        "code": "OWER0001"
                    });
                }

                console.log('CHANGE EMAIL - SignUp Success');
                res.status(200).json({
                    "code": "OWMS20001"
                });
                // audit.email = result[0][0][0].email
                // audit.clientid = result[0][0][0].clientid
                // audit.tenanturlname = result[0][0][0].tenanturlname
                // audit.verificationtoken = verificationToken
                // await auditLog.addAduditLogs(component, "ClientLogin", audit, "POST", result[0][0][0].clientid, result[0][0][0].clientid, tenantId)
                // console.log('SIGNIN - Audit Insert Done');
            }
        } else {
            console.log('EMAIL CHANGE ERROR : EXISTING USER');
            res.status(200).json({
                "code": "OWMS0005"
            });
        }


    } catch (err) {
        console.log('EMAIL CHANGE ERROR : ', err);
        res.status(400).json({
            "code": "OWMS0004"
        });
    }



    // try {
    //     const client = await clientdb.updateClientLanguage(clientId, tenantId, languageId);
    //     res.status(200).json(client[0][0]);
    //     await auditLog.addAduditLogs(component, "updateClientLanguage", req.body, "POST", clientId, clientId, tenantId)
    // } catch (error) {
    //     if (!error.statusCode) {
    //         error.statusCode = 500;
    //     }
    //     next(error);
    // }
}





exports.ClientRefresh = async (req, res, next) => {
    try {
        return await refreshToken(req, res, next);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.ClientSignOut = async (req, res, next) => {
    try {
        return clientSignOut(req, res);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

// exports.ClientUpdate = async (req, res, next) => {
//     try {
//         const client = await clientdb.ClientfinalEncrypt, authTagUpdate(req.body);
//         res.status(200).json(client[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.ClientDelete = async (req, res, next) => {
//     try {
//         const client = await clientdb.ClientDelete(req.body);
//         res.status(200).json(client[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.ClientGetAll = async (req, res, next) => {
//     try {
//         const client = await clientdb.ClientGetAll();
//         res.status(200).json(client[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.ClientGetByID = async (req, res, next) => {
//     try {
//         const client = await clientdb.ClientGetByID(req.params.clientid);
//         res.status(200).json(client[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }



// exports.ClientChangePassword = async (req, res, next) => {
//     try {
//         // let clientpasswordsalt = crypto.randomUUID();
//         req.body.clientpassword = CryptoJS.AES.encrypt(req.body.clientpassword, DATA_ENCRYPT_KEY);

//         // req.body.clientpasswordsalt = clientpasswordsalt;
//         const client = await clientdb.ClientChangePassword(req.body);
//         res.status(200).json(client[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }