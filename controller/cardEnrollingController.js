const cardenrollingDB = require("../models/cardEnrolling");
const clientDB = require("../models/client");
const tenantdb = require("../models/tenant");
const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const auditLog = require("../utils/auditlog");
const { RSAEncryptionB64, ConvertToBase64, AESGCMDecryption, RSADecryption, ConvertToASCII, RSAEncryptionURLB64 } = require("../utils/encryptions");
const { default: axios } = require("axios");
const { GetParametersFromAWS } = require("../utils/aws-psm");
const { getNodeCachedData, setNodeCacheData, getRedisCachedData } = require("../utils/cache");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const component = "CARD_ENROLL";

exports.GetAllClientCards = async (req, res, next) => {
    try {
        logger.info({ query: req.query }, "Fetching all client cards");
        const clientcardsres = await cardenrollingDB.getAllClientCards(req.query);
        const clientcards = [...clientcardsres[0]];

        for (let i = 0, j = clientcards.length; i < j; i++) {
            clientcards[i].last4digits = CryptoJS.AES.decrypt(clientcards[i].last4digits, DATA_ENCRYPT_KEY, { iv: clientcards[i].cardIV }).toString(CryptoJS.enc.Utf8);
        }
        logger.info(`Successfully retrieved ${clientcards.length} cards`);
        res.status(200).json(clientcards);
    } catch (error) {
        logger.error({ err: error }, "Error fetching client cards");
        res.status(500).json({ error: "Failed to fetch cards" });
    }
}

exports.DeleteClientCard = async (req, res, next) => {
    try {
        logger.info({ query: req.query }, "Deleting client card");
        const clientcard = await cardenrollingDB.deleteClientCard(req.query);
        const client = req.cookies["ow-c"];

        res.status(202)
            .cookie("ow-c", req.cookies["ow-c"], {
                expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                domain: HOST_DOMAIN,
                sameSite: "none",
                secure: true
            })
            .json(req.cookies["ow-c"]);

        await auditLog.addAduditLogs(component, "DeleteClientCard", req.query, "DELETE", req.query.id, req.query.clientid, req.query.tenantid);
        logger.info("Successfully deleted client card");
    } catch (error) {
        logger.error({ err: error }, "Error deleting client card");
        res.status(500).json({ error: "Failed to delete card" });
    }
}

exports.CreateClientCard = async (req, res, next) => {
    logger.info("Creating new client card");
    const card = {};
    card.randomIV = crypto.randomUUID();
    card.userkey = req.client.externaluserid;
    card.userid = req.body.UserId;
    card.cardnumber = req.body.CardId;
    card.referenceid = req.body.ReferenceId;
    card.isdefault = req.body.isdefault;
    card.last4digits = CryptoJS.AES.encrypt(req.body.CardLast4, DATA_ENCRYPT_KEY, { iv: card.randomIV }).toString();

    try {
        logger.debug({ cardDetails: { userkey: card.userkey, cardNumber: card.cardnumber } }, "Checking for existing card");
        const existingCard = await cardenrollingDB.getCardByNumber(card);
        if (existingCard[0][0].length === 0) {
            const cardEnroll = await cardenrollingDB.createClientCard(card);
            const client = req.cookies["ow-c"];

            res.status(202)
                .cookie("ow-c", {
                    ...client,
                    isenrolled: 1,
                    visaclientid: card.userid,
                    domain: HOST_DOMAIN
                }, {
                    expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                    domain: HOST_DOMAIN,
                    sameSite: "none",
                    secure: true
                })
                .json({
                    ...client,
                    isenrolled: 1,
                    visaclientid: card.userid,
                    domain: HOST_DOMAIN
                });

            const { randomIV, ...cardMod } = card;
            await auditLog.addAduditLogs(component, "createClientCard", cardMod, "POST", cardEnroll[0].insertId, req.body.clientid, req.body.tenantid);
            logger.info("Successfully created new client card");
        } else {
            logger.warn({ cardNumber: card.cardnumber }, "Card already exists");
            res.status(400).json("Card Exist");
            await auditLog.addAduditLogs(component, "createClientCard", cardMod, "POST", 0, req.body.clientid, req.body.tenantid);
        }
    } catch (error) {
        logger.error({ err: error }, "Error creating client card");
        res.status(500).json({ error: "Failed to create card" });
    }
}

// Continue with the rest of the controller methods following the same pattern...
// I'll show a few key methods as examples, but the same logging pattern should be applied to all methods

exports.UnenrollClient = async (req, res, next) => {
    try {
        logger.info({ clientId: req.body.clientid }, "Unenrolling client");
        const cardEnroll = await cardenrollingDB.UnenrollClient(req.body);
        const client = req.cookies["ow-c"];

        res.status(202)
            .cookie("ow-c", {
                ...client,
                isenrolled: 0,
                visaclientid: null,
                domain: HOST_DOMAIN
            }, {
                expires: new Date(new Date().getTime() + 15 * 60 * 1000),
                domain: HOST_DOMAIN,
                sameSite: "none",
                secure: true
            })
            .json({
                ...client,
                isenrolled: 0,
                visaclientid: null,
                domain: HOST_DOMAIN
            });

        await auditLog.addAduditLogs(component, "UnenrollClient", req.body, "PUT", req.body.clientid, req.body.clientid, req.body.tenantid);
        logger.info("Successfully unenrolled client");
    } catch (error) {
        logger.error({ err: error }, "Error unenrolling client");
        res.status(500).json({ error: "Failed to unenroll client" });
    }
}