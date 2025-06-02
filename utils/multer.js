

const multer = require("multer");

const multerConfig = multer.memoryStorage();

exports.multerupload = multer({
    storage: multerConfig
});
