const { GetParametersFromAWS } = require("./utils/aws-psm");


S3_BUCKET = "";
PULSE_ID_API = "";
WHITE_LIST_URL = "";
JWT_KEY = "";
DATA_ENCRYPT_KEY = "";
EMAIL_API_USER = "";
EMAIL_API_SECRET = "";
VISA_AES_KEY = "";
VISA_AES_IV = "";
VISA_INFO1 = "";
VISA_ENROLL_API = "";
HOST_URL = "";
CAPTCHA_SECRET = "";
HOST_DOMAIN = "";
CLOUD_FRONT = "";

COMMUNITY_CODE = "";
VISA_GATEWAY_URL = "";
EXPRESS_MINI_URL = "";

PUBLIC_KEY = "";
PRIVATE_KEY = "";
CERT_VERSION = "";
COGNITO_USER_POOL_ID = ""
COGNITO_CLIENT_ID = ""
GOOGLE_RECAPTCHA_URL = "";
ENABLE_RECAPTCHA = "";

CACHE_DATA = ";"


exports.GetOfferWallInfo = async () => {
    const aws_BucketName = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/aws-bucket-name");
    S3_BUCKET = aws_BucketName.Parameter.Value;
    // console.log("S3_BUCKET :", S3_BUCKET)

    const visaInfo1 = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/web/rsa-encrypted-info1");
    VISA_INFO1 = visaInfo1.Parameter.Value;
    // console.log("VISA_INFO1 :", VISA_INFO1)


    //////////////////////////////////////////////////

    const captchasecret = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/recaptcha-secret");
    CAPTCHA_SECRET = captchasecret.Parameter.Value;
    // console.log("CAPTCHA_SECRET :", CAPTCHA_SECRET)



    /////////////////////////////////////////////////

    const pulseId_API = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/pulseid-api");
    PULSE_ID_API = pulseId_API.Parameter.Value;

    const whitelist_urls = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/white-list-urls");
    const urlList = whitelist_urls.Parameter.Value.split(",");
    WHITE_LIST_URL = urlList.map(url => {
        return url.trim();
    });

   
    // const cognito_client_id = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/cognito-client-id");
    // COGNITO_CLIENT_ID = cognito_client_id.Parameter.Value;

    // const cognito_pool_id = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/cognito-pool-id");
    // COGNITO_USER_POOL_ID = cognito_pool_id.Parameter.Value;

    const jwt = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/jwt-key");
    JWT_KEY = jwt.Parameter.Value;

    const dek = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/data-encrypt-key");
    DATA_ENCRYPT_KEY = dek.Parameter.Value;

    const drek = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/data-rev-encrypt-key");
    DATA_REV_ENCRYPT_KEY = drek.Parameter.Value;

    const emailApiUser = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/email-api/email-api-user");
    EMAIL_API_USER = emailApiUser.Parameter.Value;

    const emailApiSecret = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/email-api/email-api-secret");
    EMAIL_API_SECRET = emailApiSecret.Parameter.Value;


    const visaAesKey = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/web/aes-key");
    VISA_AES_KEY = visaAesKey.Parameter.Value;

    const visaAesIv = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/web/aes-iv");
    VISA_AES_IV = visaAesIv.Parameter.Value;



    const visaEnrollApi = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/web/visa-api");
    VISA_ENROLL_API = visaEnrollApi.Parameter.Value;

    const hostUrl = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/host/osaka-web-url");
    HOST_URL = hostUrl.Parameter.Value;



    const hostdomain = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/host/osaka-domain");
    HOST_DOMAIN = hostdomain.Parameter.Value;

    const cloudfront = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/web/cloudfront");
    CLOUD_FRONT = cloudfront.Parameter.Value;

    const communitycode = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/communitycode");
    COMMUNITY_CODE = communitycode.Parameter.Value;

    const expressminiurl = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/expressminiurl");
    EXPRESS_MINI_URL = expressminiurl.Parameter.Value;

    const visagatewayurl = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/visa-gateway/url");
    VISA_GATEWAY_URL = visagatewayurl.Parameter.Value;

    const publickey = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/publickey");
    PUBLIC_KEY = publickey.Parameter.Value;

    const privatekey = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/privatekey");
    PRIVATE_KEY = privatekey.Parameter.Value;

    const sertversion = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/cert/version");
    CERT_VERSION = sertversion.Parameter.Value;

    const googlerecaptchaurl = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/google-recaptcha-url");
    GOOGLE_RECAPTCHA_URL = googlerecaptchaurl.Parameter.Value;

    const enablerecaptcha = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/enable-recaptcha");
    ENABLE_RECAPTCHA = enablerecaptcha.Parameter.Value;

    const cache = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/cache");
    CACHE_DATA = JSON.parse(cache.Parameter.Value);


};

exports.GetDBInfo = async () => {
    console.log("db_Host")
    const db_Host = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-host");

    console.log("db_HostRead")
    const db_HostRead = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-read-host");

    console.log("db_User")
    const db_User = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-user");

    console.log("db_Password")
    const db_Password = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-password");

    console.log("db_Database")
    const db_Database = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-database");

    console.log("db_Port")
    const db_Port = await GetParametersFromAWS("/offerwall-" + process.env.ENV + "/db-port");


    // return {
    //     DB_Host: "localhost",
    //     DB_HostRead: "localhost",
    //     DB_User: "root",
    //     DB_Password: "SEVENHCAdmin@123",
    //     DB_Database: "offerwall",
    //     DB_Port: "3307"
    // };

    return {
        DB_Host: db_Host.Parameter.Value,
        DB_HostRead: db_HostRead.Parameter.Value,
        DB_User: db_User.Parameter.Value,
        DB_Password: db_Password.Parameter.Value,
        DB_Database: db_Database.Parameter.Value,
        DB_Port: db_Port.Parameter.Value
    };
}
