const multilingualDB = require("../models/multilingual");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");

exports.getAllLanguages = async (req, res, next) => {
    try {
        const languages = await multilingualDB.getAllLanguages()
        res.status(200).json(languages[0][0]);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getSelectedLanguage = async (req, res, next) => {
    const languageid = req.params.languageid;
    try {
        let langs = await getNodeCachedData(languageid)
        if (!langs) {
            const languages = await multilingualDB.getSelectedLanguage(languageid);
            langs = JSON.stringify(languages[0][0][0]);

            await setNodeCacheData(languageid, langs)
        }
        res.status(200).json(JSON.parse(langs));
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getTenantSpecificLanguages = async (req, res, next) => {
    const tenantid = req.params.tenantid;

    try {
        const languages = await multilingualDB.getTenantSpecificLanguages(tenantid);

        res.status(200).json(languages[0]);
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.updateLanguageContent = async (req, res, next) => {
    try {
        const content = await multilingualDB.updateLanguageContent(req.body)
        res.status(200).json(content)
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}
