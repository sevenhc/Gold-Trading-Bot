const multilingualDB = require("../models/multilingual");
const { uploadAnalytics } = require("../utils/aws-s3");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");
const logger = require("../utils/logger");

exports.analytics = async (req, res, next) => {
    try {
        logger.info({ type: req.query.type }, "Processing analytics request");
        
        const analytics = req.body;
        analytics.ti = new Date();
        logger.debug({ analytics }, "Setting analytics timestamp");

        await uploadAnalytics(analytics, req.query.type);
        logger.info("Analytics upload completed successfully");

        res.status(200).json({"UPLOAD_STATUS": "DONE"});
    } catch (error) {
        logger.error({ err: error }, "Error processing analytics request");
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}