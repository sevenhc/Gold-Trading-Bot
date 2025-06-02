var request = require('request');
const { GetParametersFromAWS } = require("../utils/aws-psm");

exports.fetchImage = async (req, res) => {
    try {
        const url = req.query.url; 
        request(url).pipe(res);
    } catch (error) {
        console.error("Error in /fetch-image:", error);

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

exports.getAwsParams = async (req, res) => {
    try {
        var obj = {};
        obj["recaptchaEnabled"] = ENABLE_RECAPTCHA;
        res.json(obj);
    } catch (error) {
        console.error("Error in /get-aws-params:", error);

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