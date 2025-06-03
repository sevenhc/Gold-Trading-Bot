const logger = require('../utils/logger');

exports.createErrorLogs = (elogs) => {
    logger.info({ tenantId: elogs.tenantid, transactionId: elogs.transactionId }, 'Creating error log');
    return DBConnection.query(
        "INSERT INTO `offerwall`.`error_logs` (`tenantid`,`transactionId`, `rewardAmount`, `campaignId`, `euid`, `errorMessage`, `errorCode`, `status`) VALUES(?,?,?,?,?,?,?,?)",
        [elogs.tenantid, elogs.transactionId, elogs.rewardAmount, elogs.campaignId, elogs.euid, elogs.errorMessage, elogs.errorCode, elogs.status]
    ).then(result => {
        logger.info({ id: result.insertId }, 'Successfully created error log');
        return result;
    }).catch(error => {
        logger.error({ err: error }, 'Failed to create error log');
        throw error;
    });
};

exports.getTransactionCount = (campaignId, euid, tenantid) => {
    logger.debug({ campaignId, euid, tenantid }, 'Getting transaction count');
    let query = "SELECT COUNT(*) AS count FROM `offerwall`.`error_logs` WHERE `euid` = ? AND `tenantid` = ? AND `status` = 'Active'";
    let queryParams = [euid, tenantid];

    if (campaignId !== 0) {
        query += " AND `campaignId` = ?";
        queryParams.push(campaignId);
    }

    return DBConnection.query(query, queryParams)
        .then(([rows]) => {
            logger.debug({ count: rows[0].count }, 'Retrieved transaction count');
            return rows[0].count;
        })
        .catch(error => {
            logger.error({ err: error }, 'Failed to get transaction count');
            throw error;
        });
};