exports.getAllClientCards = (client) => {
  return DBConnectionRead.query(
    "SELECT `cardenrolling`.`id`, `cardenrolling`.`cardnumber`, `cardenrolling`.`tenantid`, `cardenrolling`.`clientid`, `cardenrolling`.`last4digits`," +
    " `cardenrolling`.`referenceid`, `cardenrolling`.`isdefault`, `cardenrolling`.`cardIV`, `clientmaster`.`visaclientid`, `clientmaster`.`userkey`, `cardenrolling`.`cardalias`" +
    " FROM `offerwall`.`cardenrolling`" +
    " LEFT JOIN `offerwall`.`clientmaster` ON `cardenrolling`.`clientid` = `clientmaster`.`clientid`" +
    " WHERE `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [client.tenantid, client.clientid]
  );
};

exports.getCardByNumber = (card) => {
  return DBConnectionRead.query(
    "CALL getcardbycardnumber(?, ?);",
    [card.userkey, card.cardnumber]
  );
};

exports.createClientCard = (card) => {
  return DBConnection.query(
    "CALL `offerwall`.`clientcardcreate`(?, ?, ?, ?, ?, ?, ?);",
    [card.userkey, card.userid, card.cardnumber, card.last4digits, card.referenceid, card.isdefault, card.randomIV]
  );
};

exports.deleteClientCard = (cardinfo) => {
  return DBConnection.query(
    "DELETE FROM `offerwall`.`cardenrolling`" +
    " WHERE `cardenrolling`.`id`= ? AND `cardenrolling`.`cardnumber`= ? AND `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [cardinfo.id, cardinfo.cardid, cardinfo.tenantid, cardinfo.clientid]
  );
};

exports.CardSetDefault = (cardinfo) => {
  return DBConnection.query(
    "CALL clientcardsetdefault(?, ?, ?, ?);",
    [cardinfo.id, cardinfo.cardnumber, cardinfo.clientid, cardinfo.tenantid]
  );
};


exports.UnenrollClient = (client) => {
  return DBConnection.query(
    "CALL clientunenroll(?, ?);",
    [client.tenantid, client.clientid]
  );
};

exports.updateCardAlias = (cardid, alias, tenantid, clientid) => {
  return DBConnection.query(
    "UPDATE  `offerwall`.`cardenrolling`" +
    "SET cardalias= ? " +
    " WHERE `cardenrolling`.`cardnumber`= ? AND `cardenrolling`.`tenantid`= ? AND `cardenrolling`.`clientid`= ?",
    [alias, cardid, tenantid, clientid]
  );
};