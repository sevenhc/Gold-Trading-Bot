exports.getClientEmail = (clientid, tenantid) => {
  return DBConnectionRead.execute(
    "SELECT `clientmaster`.`email`, `clientmaster`.`authtag`, `clientmaster`.`clientIV`, `clientmaster`.`displayemail` FROM `offerwall`.`clientmaster`" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientid, tenantid]
  )
}

exports.ClientCreate = (client) => {
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
  ]);
};

exports.ClientLogin = (clientusername, clienttenantid) => {
  return DBConnection.query("CALL clientlogin(?, ?)", [
    clientusername,
    clienttenantid,
  ]);
};

exports.clientTokenUpdate = (verificationToken, verificationauthtag, clientId, clienttenantid) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster`" +
    " SET `clientmaster`.`verificationtoken`= ?, `clientmaster`.`tokenauthtag`= ?, `clientmaster`.`verificationsentat`= CURRENT_TIMESTAMP()" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?;",
    [verificationToken, verificationauthtag, clientId, clienttenantid]
  );
};




exports.UpdateClientEmailTemp = ({ username, authtag, email, displayemail, clientid, tenantid }) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster`" +
    " SET `newusername`= ?, `newauthtag`= ?, `newemail`= ?, `newdisplayemail`= ?" +
    " WHERE `clientid`= ? AND `tenantid`= ?;",
    [username, authtag, email, displayemail, clientid, tenantid]
  );
};

exports.UpdateClientEmailVerified = async ({ username, authtag, email, displayemail, clientid, tenantid }) => {
  await DBConnection.query(
    "UPDATE `offerwall`.`clientmaster`" +
    " SET `username`= `newusername`, `authtag`= `newauthtag`, `email`= `newemail`, `displayemail`= `newdisplayemail`" +
    " WHERE `clientid`= ? AND `tenantid`= ?;",
    [clientid, tenantid]
  );

  return DBConnectionRead.execute(
    "SELECT `newusername`, `newauthtag`, `newemail`, `newdisplayemail` FROM `offerwall`.`clientmaster`" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientid, tenantid]
  )

};


exports.GetUSerByUsername = async ({ newusername, tenantId }) => {
  console.log({ newusername, tenantId })
  return DBConnectionRead.execute(
    "SELECT * FROM clientmaster" +
    " WHERE tenantid= ? AND username= ? ",
    [tenantId, newusername]
  )

};

exports.tokenVerification = (token) => {
  return DBConnection.query(
    "CALL `offerwall`.`tokenVerification`(?);",
    [token]
  );
};


exports.getClientByEUID = (clientEUID, tenantId) => {
  return DBConnectionRead.execute(
    "SELECT cm.clientid, cm.userkey, cm.externaluserid, cm.email, cm.clientIV, tm.tenanturlname, cm.defaultlanguageid, cm.authtag, cm.issignupcomplete" +
    " FROM clientmaster as cm" +
    " INNER JOIN tenantmaster AS tm ON tm.tenantid = cm.tenantid" +
    " WHERE cm.externaluserid = ? AND cm.tenantid = ?",
    [clientEUID, tenantId]
  )
}


exports.clientMagicTokenUpdate = (verificationToken, verificationauthtag, clientId, clienttenantid) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster`" +
    " SET `clientmaster`.`verifytoken2`= ?, `clientmaster`.`verifytoken2authtag`= ?, `clientmaster`.`verifytoken2sentat`= CURRENT_TIMESTAMP()" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?;",
    [verificationToken, verificationauthtag, clientId, clienttenantid]
  );
};

exports.magicTokenVerification = (token) => {
  return DBConnection.query(
    "CALL `offerwall`.`magictokenverification`(?);",
    [token]
  );
};


exports.updateClientLanguage = (clientId, tenantId, languageid) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster` SET `clientmaster`.`defaultlanguageid`= ?" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [languageid, clientId, tenantId]
  );
};

exports.invalidateClientToken = (clientId, tenantId) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster` SET `clientmaster`.`verificationtoken`= NULL, `clientmaster`.`verificationsentat`= NULL" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientId, tenantId]
  );
};

exports.invalidateMagicToken = (clientId, tenantId) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster` SET `clientmaster`.`verifytoken2`= NULL, `clientmaster`.`verifytoken2sentat`= NULL" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientId, tenantId]
  );
};

exports.verifyAccount = (clientId, tenantId) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster` SET `clientmaster`.`issignupcomplete`= 1" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?",
    [clientId, tenantId]
  );
};


exports.SetQRRefCode = (tenantId, euid, qrrefcode) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster` SET `clientmaster`.`qrrefcode`= ?" +
    " WHERE `clientmaster`.`externaluserid`= ? AND `clientmaster`.`tenantid`= ?",
    [qrrefcode, euid, tenantId]
  );
};




exports.AddTokens = (accessToken, refreshToken) => {
  return DBConnection.query("CALL tokenadd(?, ?)", [
    accessToken,
    refreshToken,
  ]);
};

exports.DeleteTokens = (accessToken, refreshToken) => {
  return DBConnection.query("CALL tokendelete(?, ?)", [
    accessToken,
    refreshToken,
  ]);
};

exports.GetTokens = (token, type) => {
  return DBConnectionRead.query("CALL tokenget(?, ?)", [
    token,
    type,
  ]);
};

exports.ClientGetByExternalID = (euid) => {
  return DBConnectionRead.query("CALL clientgetbyexternaluserid(?)", [euid]);
};

exports.addClientCount = async (username) => {
  return DBConnection.query('INSERT INTO `offerwall`.`client_count` SET ?', { username: username }, function (err, result, fields) {
    if (err) throw err;
    return result.insertId;
  });
};

exports.updateEmailSubscription = (subscriptionstatus, clientId, clienttenantid) => {
  return DBConnection.query(
    "UPDATE `offerwall`.`clientmaster`" +
    " SET `clientmaster`.`isemailsubscribed`= ?" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?;",
    [subscriptionstatus, clientId, clienttenantid]
  );
};

exports.getEmailSubscription = (clientId, clienttenantid) => {
  return DBConnection.query(
    "SELECT  `clientmaster`.`isemailsubscribed` FROM `offerwall`.`clientmaster`" +
    " WHERE `clientmaster`.`clientid`= ? AND `clientmaster`.`tenantid`= ?;",
    [clientId, clienttenantid]
  );
};


// exports.ClientUpdate = (client) => {
//     return DBConnection.query("CALL clientupdate(?, ?, ?, ?, ?)",
//         [client.clientid, client.clientname, client.clientemail, client.clientpassword,
//         client.clientpasswordsalt, client.clientmobilenumber, client.clientvisacard, client.clientsalt,
//         client.clientisactive, client.clienttenantid, client.userid]);
// }

// exports.ClientDelete = (client) => {
//     return DBConnection.query("CALL clientdelete(?, ?)",
//         [client.clientid, client.userid]);
// }

// exports.ClientGetAll = () => {
//     return DBConnection.query("CALL clientgetall()");
// }

// exports.ClientGetByID = (clientid) => {
//     return DBConnection.query("CALL clientgetbyid(?)",
//         [clientid]);
// }

// exports.ClientVerify = (client) => {
//     return DBConnection.query("CALL clientverify(?)",
//         [client.clientsalt]);
// }

// exports.ClientChangePassword = (client) => {
//     return DBConnection.query("CALL clientchangepassword(?, ?, ?)",
//         [client.clientid, client.clientpassword, client.clientpasswordsalt]);
// }
