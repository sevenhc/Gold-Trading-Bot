const logger = require('../utils/logger');

exports.getAllClientCards = (client) => {
  logger.info({ tenantId: client.tenantid, clientId: client.clientid }, 'Getting all client cards');
  return DBConnectionRead.query(
    "SELECT `cardenrolling`.`id`, `cardenrolling`.`cardnumber`, `cardenrolling`.`tenantid`, `cardenrolling`.`clientid`, `cardenrolling`.`last4digits`," +
    " `cardenrolling`.`referenceid`, `cardenrolling`.`isdefault`, `cardenrolling`.`cardIV`, `clientmaster`.`visaclientid`, `clientmaster`.`userkey`, `cardenrolling`.`cardalias`" +
    " FROM `offerwall`.`cardenrolling`" +
    " LEFT JOIN `offerwall`.`clientmaster` ON `cardenrolling`.`clientid` = `clientmaster`.`clientid`" +
    " WHERE `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [client.tenantid, client.clientid]
  ).then(result => {
    logger.info({ count: result.length }, 'Successfully retrieved client cards');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get client cards');
    throw error;
  });
};

exports.getCardByNumber = (card) => {
  logger.info({ userKey: card.userkey }, 'Getting card by number');
  return DBConnectionRead.query(
    "CALL getcardbycardnumber(?, ?);",
    [card.userkey, card.cardnumber]
  ).then(result => {
    logger.info('Successfully retrieved card by number');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get card by number');
    throw error;
  });
};

exports.createClientCard = (card) => {
  logger.info({ userKey: card.userkey }, 'Creating client card');
  return DBConnection.query(
    "CALL `offerwall`.`clientcardcreate`(?, ?, ?, ?, ?, ?, ?);",
    [card.userkey, card.userid, card.cardnumber, card.last4digits, card.referenceid, card.isdefault, card.randomIV]
  ).then(result => {
    logger.info({ id: result[0].insertId }, 'Successfully created client card');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to create client card');
    throw error;
  });
};

exports.deleteClientCard = (cardinfo) => {
  logger.info({ id: cardinfo.id, tenantId: cardinfo.tenantid }, 'Deleting client card');
  return DBConnection.query(
    "DELETE FROM `offerwall`.`cardenrolling`" +
    " WHERE `cardenrolling`.`id`= ? AND `cardenrolling`.`cardnumber`= ? AND `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [cardinfo.id, cardinfo.cardid, cardinfo.tenantid, cardinfo.clientid]
  ).then(result => {
    logger.info('Successfully deleted client card');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to delete client card');
    throw error;
  });
};

exports.CardSetDefault = (cardinfo) => {
  logger.info({ id: cardinfo.id, tenantId: cardinfo.tenantid }, 'Setting default card');
  return DBConnection.query(
    "CALL clientcardsetdefault(?, ?, ?, ?);",
    [cardinfo.id, cardinfo.cardnumber, cardinfo.clientid, cardinfo.tenantid]
  ).then(result => {
    logger.info('Successfully set default card');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to set default card');
    throw error;
  });
};

exports.UnenrollClient = (client) => {
  logger.info({ tenantId: client.tenantid, clientId: client.clientid }, 'Unenrolling client');
  return DBConnection.query(
    "CALL clientunenroll(?, ?);",
    [client.tenantid, client.clientid]
  ).then(result => {
    logger.info('Successfully unenrolled client');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to unenroll client');
    throw error;
  });
};

exports.updateCardAlias = (cardid, alias, tenantid, clientid) => {
  logger.info({ cardId: cardid, tenantId: tenantid }, 'Updating card alias');
  return DBConnection.query(
    "UPDATE  `offerwall`.`cardenrolling`" +
    "SET cardalias= ? " +
    " WHERE `cardenrolling`.`cardnumber`= ? AND `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [alias, cardid, tenantid, clientid]
  ).then(result => {
    logger.info('Successfully updated card alias');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to update card alias');
    throw error;
  });
};