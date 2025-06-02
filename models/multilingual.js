exports.getAllLanguages = () => {
  return DBConnectionRead.query(
    "CALL languagegetall()"
)
};

exports.getTenantSpecificLanguages = (tenantid) => {
  return DBConnectionRead.query(
    "SELECT `languagemaster`.`languageid`, `languagemaster`.`languagecode`, `languagemaster`.`languagename`, `languagemaster`.`languagenametranslate`" +
    " FROM `offerwall`.`tenantcontent`" +
    " LEFT JOIN `offerwall`.`languagemaster` ON `tenantcontent`.`languagemasterid` = `languagemaster`.`languageid`" +
    " WHERE `tenantcontent`.`tenantmasterid`= ? AND isactive=1",
    [tenantid]
  );
};

exports.getSelectedLanguage  = (id) => {
  return DBConnectionRead.query(
      "CALL languagegetbyid(?)",
      [
          id
      ]
  )
}

exports.updateLanguageContent = (content) => {
  return DBConnection.query(
    "CALL languagecontentupdate(?, ?)",
    [
      content.languageid,
      content.languagecontent
    ]
  )
}

