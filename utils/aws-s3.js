const S3 = require("aws-sdk/clients/s3");
const logger = require("./logger");

const uploadImageToS3 = async (files, tenantname) => {
    logger.info({ tenant: tenantname }, "Starting S3 image upload");
    const s3 = new S3();

    const filestoupload = Object.keys(files).map(prop => {
        const file = files[prop][0];
        const ext = file.mimetype.split("/")[1];

        logger.debug({ fileName: `${file.fieldname}s/${tenantname}.${ext}` }, "Preparing file for upload");

        return {
            Bucket: S3_BUCKET,
            Key: `${file.fieldname}s/${tenantname}.${ext}`,
            Body: file.buffer,
        };
    });

    try {
        const results = await Promise.all(filestoupload.map((filetoupload) => s3.upload(filetoupload).promise()));
        logger.info({ count: results.length }, "Successfully uploaded files to S3");
        return results;
    } catch (error) {
        logger.error({ err: error }, "Error uploading files to S3");
        throw error;
    }
};

const uploadAnalytics = async (data, type) => {
    const s3 = new S3();
    logger.info({ type }, "Starting analytics upload to S3");
    
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();

    const key = `analytics/${type}/${year}/${month}/${day}/${hour}/${new Date().toISOString()}.json`;
    logger.debug({ key }, "Generated S3 key for analytics");

    return new Promise((resolve, reject) => {
        s3.putObject(
            {
                Body: JSON.stringify(data),
                Bucket: S3_BUCKET,
                Key: key,
                ContentType: 'application/json; charset=utf-8',
            },
            (error, data) => {
                if (error) {
                    logger.error({ err: error }, "S3 upload error");
                    return reject(error);
                }
                logger.info("Successfully uploaded analytics to S3");
                return resolve(data);
            }
        );
    });
};

module.exports = { uploadImageToS3, uploadAnalytics };