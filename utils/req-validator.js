const { body, param, } = require('express-validator')
exports.sanitizebody = (...fields) => {
    return [
        body(fields).trim()
    ]
}

exports.sanitizeparams = (...fields) => {
    return [
        param(fields).trim()
    ]
}

exports.sanitizeemail = (...fields) => {
    return [
        body(fields).isEmail().normalizeEmail()
    ]
}
