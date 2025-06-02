exports.TenantCreate = (tenant) => {
  return DBConnection.query(
    "CALL tenantcreate(?, ?, ?, ?, ?)",
    [
      tenant.tenantname,
      tenant.tenantallowsignup,
      tenant.tenantisactive,
      tenant.tenanturlname,
      tenant.userid
    ],
  );
};

exports.TenantUpdate = (tenant) => {
  return DBConnection.query(
    "CALL tenantupdate(?, ?, ?, ?, ?, ?)",
    [
      tenant.tenantid,
      tenant.tenantname,
      tenant.tenantallowsignup,
      tenant.tenantisactive,
      tenant.tenanturlname,
      tenant.userid,
    ]
  );
};

exports.TenantDelete = (tenantid) => {
  return DBConnection.query(
    "CALL tenantdelete(?)", 
    [
    tenantid
  ]);
};

exports.TenantGetAll = () => {
  return DBConnectionRead.query("CALL tenantgetall()");
};

exports.TenantGetByID = (tenantid) => {
  return DBConnectionRead.query("CALL tenantgetbyid(?)", [tenantid]);
};

exports.TenantGetContentByID = (tenantid, languageid) => {
  return DBConnectionRead.query("CALL tenantgetcontentbyid(?, ?)", [tenantid, languageid]);
};

exports.TenantGetByURLName = (tenantid, languageid) => {
  return DBConnectionRead.query("CALL tenantgetbyurlname(?, ?)", [tenantid, languageid]);
};

exports.TenantUpdateParamStoreValues = (tenant) => {
  return DBConnection.query("CALL tenantupdateparamstorevalues(?, ?, ?)", [
    tenant.tenanturlname,
    tenant.tenantapikeyname,
    tenant.tenantapisecretname,
  ]);
};

exports.getTenantSignupValues = (tenantid) => {
  return DBConnectionRead.query(
    "SELECT `tenantmaster`.`tenantpromocode`, `tenantmaster`.`tenanturlname` FROM `offerwall`.`tenantmaster`" +
      " WHERE `tenantmaster`.`tenantid`= ?",
    [tenantid]
  );
};
