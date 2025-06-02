exports.createAuditLogs = (audit) => {
    return DBConnection.query(
      "INSERT INTO `offerwall`.`auditlog` (`tenantid`, `recordid`, `functionname`, `newvalue`, `component`, `action`, `actionby`, `clientheaderinfo`) VALUES(?,?,?,?,?,?,?,?)",
      [audit.tenantid, audit.recordid, audit.functionname, audit.newvalue, audit.component, audit.action, audit.actionby, audit.clientheaderinfo]
    );
  };

