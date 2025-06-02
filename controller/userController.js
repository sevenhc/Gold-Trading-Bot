const userdb = require("../models/user");
const https = require("https");
const CryptoJS = require("crypto-js");
const { generateAccessToken, generateRefreshToken, refreshToken, userSignOut } = require("../utils/jwt-token");
const { default: axios } = require("axios");
const fs = require("fs");
const jwt = require('jsonwebtoken');
// const sslRootCAs = require('ssl-root-cas/latest').create();
// const { axios} = require("axios");




// exports.VereTest = async (req, res, next) => {
//     try {
//         // credentials containing client certificate
//         const CREDENTIALS = {
//             "cert": `-----BEGIN CERTIFICATE-----
// MIIFAjCCA+qgAwIBAgIUQ2pr5DK3Ic3g10ML2/RYJkt+WbQwDQYJKoZIhvcNAQEL
// BQAwgbcxCzAJBgNVBAYTAkNOMRIwEAYDVQQIDAlndWFuZ2RvbmcxETAPBgNVBAcM
// CHNoZW56aGVuMRIwEAYDVQQKDAlzd2lmdHBhc3MxFDASBgNVBAsMC3Zpc2FMb3lh
// bHR5MS4wLAYDVQQDDCV2dmFuc3ZlcmUwMy1leHRlcm5hbC11YXQuc3dpZnRwYXNz
// LmNuMScwJQYJKoZIhvcNAQkBFhhqaW53ZWkueWFuZ0Bzd2lmdHBhc3MuY24wHhcN
// MjIwNjI3MTIzMDM2WhcNMjUwNjI2MTIzMDM2WjB2MRYwFAYDVQQDDA0qLnB1bHNl
// aWQuY29tMQswCQYDVQQGEwJTRzESMBAGA1UECAwJU2luZ2Fwb3JlMRIwEAYDVQQH
// DAlTaW5nYXBvcmUxGjAYBgNVBAoMEVB1bHNlIEdsb2JhbCBMdGQuMQswCQYDVQQL
// DAJJVDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPaCuvxOBRL4Hv2I
// bcOO0cgj0qoHUz1amUSdpohWSczPrt8r//+JS32U2Ba32ZOEcZ3DkSyBv2MChV76
// FkEnMUXJ4GxAARBC+sH/oNcJNOz77Xam1slUYCeDLATPaxTBvonbOBk3b7zCh0Mq
// KXqK1oxNRUMDOpT72Xr6v3TJYIdTPMz1KYr2nAgoT4C6djnKmBRQeLQ5/WnlyziC
// QRYVhcuBf7+Gz672EzC6zEGpwWkqL1nModsBo7pvJrPnBIiEtGRB70gaKWvZcXXj
// tZa0bwpSX8DYB5s29C4vi4944YaSZ9Fif8XOoZ/HHXUqYQoAgJQVb2Iqr9u/KZzY
// bmfL3icCAwEAAaOCAUQwggFAMA4GA1UdDwEB/wQEAwIFoDAgBgNVHSUBAf8EFjAU
// BggrBgEFBQcDAQYIKwYBBQUHAwIwbAYDVR0RBGUwY4IldnZhbnN2ZXJlMDMtZXh0
// ZXJuYWwtdWF0LnN3aWZ0cGFzcy5jboIbdnZhbnMtZXh0ZXJuYWwuc3dpZnRwYXNz
// LmNugg0qLnB1bHNlaWQuY29tgg4qLnN3aWZ0cGFzcy5jbjAOBgNVHQ8BAf8EBAMC
// BaAwIAYDVR0lAQH/BBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMGwGA1UdEQRlMGOC
// JXZ2YW5zdmVyZTAzLWV4dGVybmFsLXVhdC5zd2lmdHBhc3MuY26CG3Z2YW5zLWV4
// dGVybmFsLnN3aWZ0cGFzcy5jboINKi5wdWxzZWlkLmNvbYIOKi5zd2lmdHBhc3Mu
// Y24wDQYJKoZIhvcNAQELBQADggEBAByKRYi8ZK8S65NL8tL2bccj/mIhv2BG2PXu
// XSKl9nofqm0iAbRrpEoGsktDUKkTksGnVWep/C3NsSIsmR3vMu/2pKZLgHvmyXZp
// oXI3UcBrTXZCrg/q8qnVrF0ofGVKaln+QyqOuFKEGLNqpaDLunET9BYKeTg9edAg
// +/HEr1ZW2m5jUGMlYmhLJcoj32fQy1K5SREn3NgZTxR9nspK9LMw2y3m/hEIAzis
// un8YiAcLm2djv37DkWJD2R0MqEG8kINs1N+ytjunkiWotLyeGhsKkY04moDMRD3j
// xas+vXydQ7pJICHFIVqYpv5KN/UcxCNFrx/hw93/c53q92bWx2E=
// -----END CERTIFICATE-----`,
//             "certurl": "https://vvansvere03-external-uat.swiftpass.cn",
//             //"clientid": "sb-clicertxsappname!t12345",
//             "key": `-----BEGIN RSA PRIVATE KEY-----
// MIIEpAIBAAKCAQEA9oK6/E4FEvge/Yhtw47RyCPSqgdTPVqZRJ2miFZJzM+u3yv/
// /4lLfZTYFrfZk4RxncORLIG/YwKFXvoWQScxRcngbEABEEL6wf+g1wk07PvtdqbW
// yVRgJ4MsBM9rFMG+ids4GTdvvMKHQyopeorWjE1FQwM6lPvZevq/dMlgh1M8zPUp
// ivacCChPgLp2OcqYFFB4tDn9aeXLOIJBFhWFy4F/v4bPrvYTMLrMQanBaSovWcyh
// 2wGjum8ms+cEiIS0ZEHvSBopa9lxdeO1lrRvClJfwNgHmzb0Li+Lj3jhhpJn0WJ/
// xc6hn8cddSphCgCAlBVvYiqv278pnNhuZ8veJwIDAQABAoIBAC9sdwyS9ebwVQXx
// eSxmDXWzbpPHVPw4scPBkIgqEYiVa88DZ/yBLUS7ndbBB9qZYEI5nXQygd9KXN4o
// vp9KKvCCJeqtZYb7W8J2qzqzSrtMvCJXdnrFALqZQZ6rSK51l3Jt+hzfzV9DDUKe
// mdw5WY0kUG7T8DE5Ql2mX67YDvn5aM3a83NNtvWNKtBLa499njs5QwdGrMAhkoi2
// uEK4LINIzmatRzQ7tI3qpTz811MP3ZUrsAO01kTqX/v8MHFrnyV4XY0VOYdwMKUc
// UpRir17KkENFTvsI88mBI1hehqxm5N7nbSkLpE8ANrUKPiVykghJbz2Sik5QQdI/
// Dk7wogECgYEA/xrxWZ8STNK+/4mJ+GAPaf+btV5T+V+0zSedXmgUYcC69uLCVlbI
// PFhbB0KFBb8IqJXtFAnDNrUvvC/TphwAKQRYK44U6wK7ebGBitH75R5D5bebxqFF
// cs5eE9SGqj2jn840CDths3cwaM19kk76otDn/OjMHLif3ZvNawo16TsCgYEA92AS
// FIFPTyRvJxVGqslNGCKGBEya42oQIEsu787OzRF9Z2kzTHs0ztpW7xM+T3vaXbqW
// rVekju8krU+GHx9HIcTL0JxmkkuuX0tEco0Ph0sK7BxKLXobcBsrhYG7AcioQgwH
// PLqnIuWSsPmGFTv7pLBtS1jYkSut6ddxAxTV8AUCgYAmZ13yCfptSkSqn3//viZT
// 5MECGsM1hWzofZA5SB3ZYXRD+nsbGFFolDyP6TmxVcLt7jQUkiurLreS8vg/x3NW
// uWq0k90eS/kBJvHDfj0XjujVykBPNLQJxntvLM1hD4p0Ykx++MGKjOTiwhynS/B7
// Vku2TS19HWYjrHLOLGlVRQKBgQCugb8/Z9ki43jmAURQxqD0Haac8c1yEChAH8mE
// skeAso3cnYHquh+OrMgW72RNffmVlUMmFWWoz1r4R9k9qzrqv4FoMGzLV0gzQU2P
// 4aLKtk2GMo7BdhpVA1W4YMQjhgHsVb/lP2cYXwsUfXHxGNd0XmE7ffmIr1+ITssS
// eWhSYQKBgQCPRstmz78aDB8Eb3rblkyoMWTAZOxrYw2ZPlo2mcr4oEzSUaAwhnbZ
// DubSbfaYnCDTHxIrKYvH9lrRX2zw4tO/oV6jY3WDgA4BHVSAUZ9ACq1TKx7Ik2F2
// w3oRTTh4pLki+2o9n/45URchoDbPY0wuP+NQU09di0TWrdj25xNnYQ==
// -----END RSA PRIVATE KEY-----`,
//             "CA": `-----BEGIN CERTIFICATE-----
// MIID9zCCAt8CFHH3WxUrjQ4j4AJwxdg1j8J2ez3AMA0GCSqGSIb3DQEBCwUAMIG3
// MQswCQYDVQQGEwJDTjESMBAGA1UECAwJZ3Vhbmdkb25nMREwDwYDVQQHDAhzaGVu
// emhlbjESMBAGA1UECgwJc3dpZnRwYXNzMRQwEgYDVQQLDAt2aXNhTG95YWx0eTEu
// MCwGA1UEAwwldnZhbnN2ZXJlMDMtZXh0ZXJuYWwtdWF0LnN3aWZ0cGFzcy5jbjEn
// MCUGCSqGSIb3DQEJARYYamlud2VpLnlhbmdAc3dpZnRwYXNzLmNuMB4XDTIyMDYw
// ODAyNDE0NFoXDTI1MDYwNzAyNDE0NFowgbcxCzAJBgNVBAYTAkNOMRIwEAYDVQQI
// DAlndWFuZ2RvbmcxETAPBgNVBAcMCHNoZW56aGVuMRIwEAYDVQQKDAlzd2lmdHBh
// c3MxFDASBgNVBAsMC3Zpc2FMb3lhbHR5MS4wLAYDVQQDDCV2dmFuc3ZlcmUwMy1l
// eHRlcm5hbC11YXQuc3dpZnRwYXNzLmNuMScwJQYJKoZIhvcNAQkBFhhqaW53ZWku
// eWFuZ0Bzd2lmdHBhc3MuY24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// AQC+nTebOCLAKcHviCPmZ8CiQAIOLObjlqbXaVV0DV+rRr880sQ+a2JOiN2d2ZQq
// OSRe+ULFC7oG+4NrnT/q6JeDjOeh3iYKFDcS+2iU18E0n9PhwlzPZBYHVDkR5xTg
// j/TL1mEWcMHB29oltgiAtVEUxkb9pQVQZojeS9JiQ5nh3kn0MG5Yr9c8FXO35hIw
// Gt8Y66e1Gnd277CZ0l5RYNrjqa/Q96HhV0LYsOGgkEYRufYiWY2cqX9FY64JS3gh
// El9rQVTtMbabG+59LjlXGR4HgtyrVN79hfxyfuqyyt1bwwkkY8Vp8OZbmJoLrt60
// SEiDoVNZIeaOv0AZdhBM60xjAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAJbuxLhB
// 5hQ97uDoAPByYgtgpROWvUM70Lbld3At6UOw6zmOShgQkdmPP3ogkVQw16QYlB1W
// g6NuOaKoN8kNAEsD+GnOsZE96po7qWQfzcnC/01BSoltjK0s4YUvwb4nbK/wNP73
// UtCn4x6s4HeydzvKFWf7IFw7iZT6+df87v4LL4aQ7y82rJk2Ua8oB9z71xBEKcWL
// Z8KF/TtPiyVAel9arCaeHvnL4TyqdwlUpHIuZskrgS0X3La8HjtgDPQN2CtxlN1G
// ITft/vZ+PHhRf0tzvdsCsuX09YVnYYEB95TeaTd9M/FvpbDKVsJTRNDPhZgP3+jt
// DbqBfB9QYpMv3W4=
// -----END CERTIFICATE-----`
//         }

//         // configure request
//         const options = {
//             url: CREDENTIALS.certurl + '/external/api/vox/notifyOfferMerchant',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': "Basic Vk9YOmU1NTg0OTdkLTFmMDgtNWE3Zi1hOTI5LTI4MDJhNTQ4ODA4ZQ==",
//                 'HOST': "vvansvere03-external-uat.swiftpass.cn"
//             },
//             method: 'POST',
//             withCredentials: true,
//             data: "",
//             httpsAgent: new https.Agent({
//                 cert: CREDENTIALS.cert,
//                 key: CREDENTIALS.key,
//                 ca: fs.readFileSync('root-cert.cer')
//                 //[CREDENTIALS.CA, CREDENTIALS.cert]
//                 // rejectUnauthorized: false
//             })
//         }


//         console.log("==========")
//         console.log(options)
//         console.log("==========")
//         // execute request
//         const response = await axios(options);

//         console.log(`Result: ${response.data}`)
//         return res.status(200).send(response.data)


//         // const response = axios.post(
//         //     "", 
//         //     {}
//         // );
//         //res.status(200).json("OK");
//     } catch (error) {
//         console.log("ERROR : ", error)
//         return res.status(400).send("error");
//     }
// }


exports.UserAdminCreate = async (req, res, next) => {
    try {
        const pw = CryptoJS.AES.encrypt("OfferWallAdmin@123", DATA_ENCRYPT_KEY).toString();
        const user = await userdb.UserAdminCreate(pw);
        res.status(200).json(user[0][0]);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.UserCreate = async (req, res, next) => {
    try {
        req.body.usersalt = "";
        //req.body.userpassword = CryptoJS.AES.encrypt(req.body.userpassword, DATA_ENCRYPT_KEY).toString();
        const user = await userdb.UserCreate(req.body);

        res.status(200).json(user);
    } catch (error) {
        console.log('error', error)
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.UserLogin = async (req, res, next) => {
    try {
        const user = await userdb.UserLogin(req.body);

        if (user[0][0].length === 0) {
            res.status(401).json("Incorrect email and password..");
        } else {
            const encryptedPW = CryptoJS.AES.decrypt(user[0][0][0].userpassword, DATA_ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
            if (encryptedPW !== req.body.userpassword) {
                res.status(401).json("Incorrect email and password.");
            } else {
                const { userid, userfirstname, userlastname, useremailaddress } = user[0][0][0];
                const accessToken = generateAccessToken(userid);
                const refreshToken = generateRefreshToken(userid);
                // res.status(200).json({ userid, userfirstname, userlastname, useremailaddress, accessToken, refreshToken });
                res.status(202)
                    .cookie("aat", accessToken, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        httpOnly: true,
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .cookie("aas", true, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .cookie("art", refreshToken, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        httpOnly: true,
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .cookie("artid", true, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .cookie("ow-u", {
                        userid,
                        userfirstname,
                        userlastname,
                        useremailaddress,
                        accessToken,
                        refreshToken,
                        domain: HOST_DOMAIN

                    }, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .json({
                        userid,
                        userfirstname,
                        userlastname,
                        useremailaddress,
                        accessToken,
                        refreshToken,
                        domain: HOST_DOMAIN
                    });
            }
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}


exports.UserVerification = async (req, res, next) => {
    console.log('User VERIFICATION - IN');
    const userToken = req.body.usertoken;
    try {

        const user = await userdb.tokenVerification(userToken);
        res.send(user);
        console.log('CLIENT VERIFICATION - Check Verify Token in DB : ', user[0][0]);

        if (user[0][0].length > 0) {
            console.log('CLIENT VERIFICATION - Verify Token Exist');
            const userObj = user[0][0][0]
            const { userid, userfirstname, userlastname, tokenexpiry, verificationtoken, useremailaddress
            } = userObj;


            if (tokenexpiry > 5 || verificationtoken !== userToken) {
                console.log('CLIENT VERIFICATION - Verify Token Expired or Not Match');
                res.status(400).json("Your verification URL is expired! please try again!");
                await auditLog.addAduditLogs(component, "UserVerification", "User Verification URL is expired", "POST", userid);

            } else {
                const accessToken = generateAccessToken(userid);
                const refreshToken = generateRefreshToken(userid);
                console.log('CLIENT VERIFICATION - Access and Refresh Token Generated');
                await userdb.AddTokens(accessToken, refreshToken);
                console.log('CLIENT VERIFICATION - Access and Refresh Tokens Added to DB');
                await userdb.invalidateClientToken(clientid, tenantid);
                console.log('CLIENT VERIFICATION - Invalidate Existing Verify Token');
                await userdb.verifyAccount(clientid, tenantid)
                console.log('CLIENT VERIFICATION - Complete SignUp Process');
                console.log('CLIENT VERIFICATION - Verification Success');
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
                    .cookie("ow-u", {
                        clientid,
                        defaultlanguageid,
                        externaluserid,
                        isenrolled,
                        languagecode,
                        tenantid,
                        visaclientid,
                        domain: HOST_DOMAIN
                    }, {
                        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                        domain: HOST_DOMAIN,
                        sameSite: "none",
                        secure: true
                    })
                    .json({
                        clientid,
                        userid, userfirstname, userlastname, tokenexpiry, verificationtoken, useremailaddress,
                        domain: HOST_DOMAIN
                    });

                await auditLog.addAduditLogs(component, "UserVerification", "User Verification Successfull", "POST", userid);
                console.log('USER VERIFICATION - Audit Insert Done');
            }
        } else {
            console.log('USER VERIFICATION - Invalid Verify Token');
            res.status(400).json("OWER0005");
        }
    } catch (error) {
        console.log('USER VERIFICATION - Verification Failed : ', error);
        res.status(400).json(error);
        await auditLog.addAduditLogs(component, "UserVerification", "User Verification Failed, " + error, "POST", null, null, req.body.userid);
    }
}


exports.UserChangePassword = async (req, res, next) => {
    try {
        //req.body.userpassword = CryptoJS.AES.encrypt(req.body.userpassword, DATA_ENCRYPT_KEY).toString();
        req.body.usersalt = "";
        const user = await userdb.UserChangePassword(req.body);
        res.status(200).json("Password Successfully Updated.");
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.UserRefresh = async (req, res, next) => {
    try {
        await refreshToken(req, res, next);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.UserSignOut = async (req, res, next) => {
    try {
        return await userSignOut(req, res);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}


// exports.UserGenerateToken = async (req, res, next) => {
//     try {
//         let jwtSecretKey = gfg_jwt_secret_key;
//         let data = {
//             username: 'nimni'
//         }

//         const token = jwt.sign(data, jwtSecretKey);
//         console.log('>>>', token)
//         res.send({ token })
//     } catch (error) {

//     }
// }


// exports.UserUpdate = async (req, res, next) => {
//     try {
//         const user = await userdb.UserUpdate(req.body);
//         res.status(200).json(user[0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.UserDelete = async (req, res, next) => {
//     try {
//         const user = await userdb.UserDelete(req.body);
//         res.status(200).json(user[0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.UserGetAll = async (req, res, next) => {
//     try {

//         const user = await userdb.UserGetAll();
//         res.status(200).json(user[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

// exports.UserGetByID = async (req, res, next) => {
//     try {
//         const user = await userdb.UserGetByID(req.params.userid);
//         res.status(200).json(user[0][0][0]);
//     } catch (error) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }
