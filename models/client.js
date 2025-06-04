const logger = require('../utils/logger');

exports.getClientEmail = (clientid, tenantid) => {
  logger.info({ clientId: clientid, tenantId: tenantid }, 'Getting client email');
  return DBConnectionRead.execute(
    "SELECT `clientmaster`.`email`, `clientmaster`.`authtag`, `clientmaster`.`clientIV`, `clientmaster`.`displayemail` FROM `offerwall`.`clientmaster`" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientid, tenantid]
  ).then(result => {
    logger.info('Successfully retrieved client email');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get client email');
    throw error;
  });
};

exports.ClientCreate = (client) => {
  logger.info({ tenantId: client.tenantid }, 'Creating new client');
  return DBConnection.query("CALL clientcreate(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    client.username,
    client.userkey,
    client.externalUserId,
    client.email,
    client.tenantid,
    client.defaultlanguageid,
    client.verificationtoken,
    client.randomIV,
    client.authtag,
    client.verificationauthtag,
    client.displayemail
  ]).then(result => {
    logger.info({ id: result[0].insertId }, 'Successfully created client');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to create client');
    throw error;
  });
};

exports.ClientLogin = (clientusername, clienttenantid) => {
  logger.info({ username: clientusername, tenantId: clienttenantid }, 'Client login attempt');
  return DBConnection.query("CALL clientlogin(?, ?)", [
    clientusername,
    clienttenantid,
  ]).then(result => {
    logger.info('Successfully processed client login');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to process client login');
    throw error;
  });
};

// Continue with the rest of the file, adding logging to each function...