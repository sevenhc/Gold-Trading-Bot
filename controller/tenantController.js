const tenantdb = require("../models/tenant");
const tenantcontentdb = require("../models/tenantContent");
const { uploadImageToS3 } = require("../utils/aws-s3");
const { getNodeCachedData, setNodeCacheData } = require("../utils/cache");

/* ---------------------------------------- TENANT CONTROLLERS ************************************** */

exports.TenantCreate = async (req, res, next) => {
    try {
        // const results = await uploadImageToS3(req.files, req.body.tenantname);
        // let logolocation = "tenantlogos/TEst.png";
        // let bannerlocation = "tenantbannerimages/TEst.jpeg";
        // for (let i = 0, j = results.length; i < j; i++) {
        //     if (results[i].Key.startsWith("tenantbannerimages")) {
        //         bannerlocation = results[i].Key;
        //     } else {
        //         logolocation = results[i].Key;
        //     };
        // }
        const tenant = await tenantdb.TenantCreate(req.body);

        res.status(200).json(tenant[0][0]);


    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantUpdate = async (req, res, next) => {
    try {
        // let results = [];
        // if (Object.keys(req.files).length > 0) {
        //     results = await uploadImageToS3(req.files, req.body.tenantname);
        // }
        // if (results.length > 0) {
        //     for (let i = 0, j = results.length; i < j; i++) {
        //         if (results[i].Key.startsWith("tenantbannerimages")) {
        //             req.body.tenantbannerimageurl = results[i].Key;
        //         } else {
        //             req.body.tenantlogourl = results[i].Key;
        //         };
        //     }
        // }
        const tenant = await tenantdb.TenantUpdate(req.body);
        res.status(200).json(tenant);

    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantDelete = async (req, res, next) => {

    try {
        const tenant = await tenantdb.TenantDelete(req.params.tenantid);
        res.status(200).json(tenant[0][0]);

    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantGetAll = async (req, res, next) => {
    try {
        const tenant = await tenantdb.TenantGetAll();
        res.status(200).json(tenant[0][0]);
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantGetByID = async (req, res, next) => {
    try {
        const tenant = await tenantdb.TenantGetByID(req.params.tenantid);
        res.status(200).json(tenant[0][0][0]);
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantGetByURLName = async (req, res, next) => {
    try {
        const starttime = new Date();
        let tenantbyname = await getNodeCachedData(req.query.tenanturlname + req.query.languageid)

        if (!tenantbyname) {
            const tenant = await tenantdb.TenantGetByURLName(req.query.tenanturlname, req.query.languageid);
            tenantbyname = JSON.stringify(tenant[0][0][0])

            await setNodeCacheData(req.query.tenanturlname + req.query.languageid, tenantbyname)
        }
        console.log("TenantGetByURLName :", new Date().getTime() - starttime)
        res.status(200).json(JSON.parse(tenantbyname));
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantUpdateParamStoreValues = async (req, res, next) => {
    try {

        const tenant = await tenantdb.TenantUpdateParamStoreValues(req.body);
        res.status(200).json("Parameters Successfully Updated.");
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}



/* ---------------------------------------- TENANT CONTENT CONTROLLERS ************************************** */

exports.TenantContentCreate = async (req, res, next) => {
    try {

        let logolocation = "";
        let bannerlocation = "";
        // for (let i = 0, j = results.length; i < j; i++) {
        //     if (results[i].Key.startsWith("tenantbannerimages")) {
        //         bannerlocation = results[i].Key;
        //     } else {
        //         logolocation = results[i].Key;
        //     };
        // }

        const content = await tenantcontentdb.TenantContentCreate(req.body, bannerlocation, logolocation);

        if (content[0][0][0].message == 'Successfully created') {
            res.status(200).json(content);
        } else {
            res.status(400).json({
                "error": "Content already exist"
            });
        }

    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantContentUpdate = async (req, res, next) => {
    try {
        const content = await tenantcontentdb.TenantContentUpdate(req.body)
        res.status(200).json(content)
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantContentDelete = async (req, res, next) => {
    try {
        const content = await tenantcontentdb.TenantContentDelete(req.params.contentid);
        res.status(200).json(content[0][0][0]);
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantContentGetAllByTenantID = async (req, res, next) => {
    try {
        const content = await tenantcontentdb.ContentGetAllByTenantId(req.params.tenantid);
        res.status(200).json(content[0][0]);
    } catch (error) {
        res.status(400).json(error);
        next(error);
    }
}

exports.TenantContentGetByID = async (req, res, next) => {
    try {
        const content = await tenantcontentdb.ContentGetById(req.params.contentid);
        res.status(200).json(content[0][0][0])
    } catch (error) {
        res.status(400).json(error);
        next(error)
    }
}

exports.EmailTemplateGetByLanguageID = async (req, res, next) => {
    try {
        const content = await tenantcontentdb.EmailTemplateGetByLanguageID(req.body);
        res.status(200).json(content[0][0][0])
    } catch (error) {
        res.status(400).json(error);
        next(error)
    }
}



