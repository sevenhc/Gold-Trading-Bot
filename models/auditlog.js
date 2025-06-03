const logger = require('../utils/logger');

exports.createAuditLogs = (audit) => {
    logger.info({ 
        component: audit.component,
        functionName: audit.functionname,
        action: audit.action 
    }, 'Creating audit log');
    
    return DBConnection.query(
        "INSERT INTO `offerwall`.`auditlog` (`tenantid`, `recordid`, `functionname`, `newvalue`, `component`, `action`, `actionby`, `clientheaderinfo`) VALUES(?,?,?,?,?,?,?,?)",
        [audit.tenantid, audit.recordid, audit.functionname, audit.newvalue, audit.component, audit.action, audit.actionby, audit.clientheaderinfo]
    ).then(result => {
        logger.info({ id: result.insertId }, 'Successfully created audit log');
        return result;
    }).catch(error => {
        logger.error({ err: error }, 'Failed to create audit log');
        throw error;
    });
};