exports.TenantContentCreate = ( content, tenantbannerimage, tenantlogo) => {
    return DBConnection.query(
        "CALL tenantcontentcreate (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            content.tenantdisplayname,
            content.tenanttagline,
            content.tenantwebsite,
            tenantbannerimage,
            tenantlogo,
            content.tenantbannertext,
            content.isactive,
            content.tenantmasterid,
            content.languagemasterid,
        ]
    )
}

exports.TenantContentUpdate = (content) => {
    return DBConnection.query(
        "CALL tenantcontentupdate (?, ?, ?, ?, ?, ?, ?, ?, ? ,?)",
        [
            content.contentid,
            content.tenantdisplayname,
            content.tenanttagline,
            content.tenantwebsite,
            content.tenantbannerimage,
            content.tenantlogo,
            content.tenantbannertext,
            content.isactive,
            content.tenantmasterid,
            content.languagemasterid,
            // content.isdefault,
            // content.tenanttearmsandconditions,
            // content.termsandconditionsdisplay,
            // content.emailtemplate
        ]
    )
}

exports.TenantContentDelete = (contentid) => {
    return DBConnection.query(
        "CALL tenantcontentdelete (?)", 
        [
            contentid
        ]
    )
}


exports.ContentGetById = (contentid) => {
    return DBConnectionRead.query(
        "CALL tenantcontentgetbyid(?)",
        [
            contentid
        ]
    )
}

exports.ContentGetAllByTenantId = (tenantid) => {
    return DBConnectionRead.query(
        "CALL tenantcontentgetallbytenantid(?)",
        [
            tenantid
        ]
    )
}

exports.EmailTemplateGetByLanguageID = (content) => {
    return DBConnectionRead.query(
        "CALL tenantcontentemailtemplateget(?, ?)",
        [
            content.contentid,
            content.languageid
        ]
    )
}