const logger = require('../utils/logger');

exports.getAllLanguages = () => {
  logger.info('Getting all languages');
  return DBConnectionRead.query(
    "CALL languagegetall()"
  ).then(result => {
    logger.info({ count: result[0].length }, 'Successfully retrieved languages');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get languages');
    throw error;
  });
};

exports.getTenantSpecificLanguages = (tenantid) => {
  logger.info({ tenantId: tenantid }, 'Getting tenant-specific languages');
  return DBConnectionRead.query(
    "SELECT `languagemaster`.`languageid`, `languagemaster`.`languagecode`, `languagemaster`.`languagename`, `languagemaster`.`languagenametranslate`" +
    " FROM `offerwall`.`tenantcontent`" +
    " LEFT JOIN `offerwall`.`languagemaster` ON `tenantcontent`.`languagemasterid` = `languagemaster`.`languageid`" +
    " WHERE `tenantcontent`.`tenantmasterid`= ? AND isactive=1",
    [tenantid]
  ).then(result => {
    logger.info({ count: result.length }, 'Successfully retrieved tenant languages');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get tenant languages');
    throw error;
  });
};

exports.getSelectedLanguage = (id) => {
  logger.info({ languageId: id }, 'Getting selected language');
  return DBConnectionRead.query(
    "CALL languagegetbyid(?)",
    [id]
  ).then(result => {
    logger.info('Successfully retrieved selected language');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to get selected language');
    throw error;
  });
};

exports.updateLanguageContent = (content) => {
  logger.info({ languageId: content.languageid }, 'Updating language content');
  return DBConnection.query(
    "CALL languagecontentupdate(?, ?)",
    [
      content.languageid,
      content.languagecontent
    ]
  ).then(result => {
    logger.info('Successfully updated language content');
    return result;
  }).catch(error => {
    logger.error({ err: error }, 'Failed to update language content');
    throw error;
  });
};