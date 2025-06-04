const AWS = require('aws-sdk');
const logger = require('./logger');

const ssmClient = new AWS.SSM();

exports.GetParametersFromAWS = async (paramname) => {
    logger.debug({ paramName: paramname }, "Getting parameter from AWS");
    try {
        const parameter = await ssmClient.getParameter({
            Name: paramname,
            WithDecryption: true,
        }).promise();
        logger.info({ paramName: paramname }, "Successfully retrieved parameter from AWS");
        return parameter;
    } catch (error) {
        logger.error({ err: error, paramName: paramname }, "Failed to get parameter from AWS");
        throw error;
    }
};