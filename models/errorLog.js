exports.createErrorLogs = (elogs) => {
    return DBConnection.query(
      "INSERT INTO `offerwall`.`error_logs` (`tenantid`,`transactionId`, `rewardAmount`, `campaignId`, `euid`, `errorMessage`, `errorCode`, `status`) VALUES(?,?,?,?,?,?,?,?)",
      [elogs.tenantid, elogs.transactionId, elogs.rewardAmount, elogs.campaignId, elogs.euid, elogs.errorMessage, elogs.errorCode, elogs.status]
    );
  };

exports.getTransactionCount = (campaignId, euid, tenantid) => {
  let query = "SELECT COUNT(*) AS count FROM `offerwall`.`error_logs` WHERE `euid` = ? AND `tenantid` = ? AND `status` = 'Active'";
  let queryParams = [euid, tenantid];

  if (campaignId !== 0) {
    query += " AND `campaignId` = ?";
    queryParams.push(campaignId);
  }

  return DBConnection.query(query, queryParams).then(([rows]) => rows[0].count);
};