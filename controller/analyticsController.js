const multilingualDB = require("../models/multilingual");
const { uploadAnalytics } = require("../utils/aws-s3");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");

exports.analytics = async (req, res, next) => {
    try {

        console.log("IN")
        const analytics = req.body;
        analytics.ti = new Date();
        console.log("SET TIME", analytics)

        await uploadAnalytics(analytics, req.query.type)
        console.log("DONE UPLOAD")

        res.status(200).json({"UPLOAD_STATUS": "DONE"});
    } catch (error) {
        console.log("ANALYTICS ERROR : ", error)
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

