

const crypto = require("crypto");

exports.RSAEncryptionB64 = (value) => {
    const encyptedValue = crypto.publicEncrypt(PUBLIC_KEY, Buffer.from(value)).toString('base64');
    return encyptedValue;
}
exports.RSAEncryptionURLB64 = (value) => {
    const encyptedValue = crypto.publicEncrypt(PUBLIC_KEY, Buffer.from(value)).toString('base64url');
    return encyptedValue;
}

exports.RSADecryption = (value) => {
    const decyptedValue = crypto.privateDecrypt(PRIVATE_KEY, Buffer.from(value, 'base64')).toString();
    return decyptedValue;
}


exports.ConvertToBase64 = (value) => {
    const base64Value = Buffer.from(value).toString('base64');
    return base64Value;
}


exports.ConvertToASCII = (value) => {
    const asciiValue = Buffer.from(value, 'base64').toString('ascii');
    return asciiValue;
}



//helper encryption functions 
exports.AESGCMEncryption = (data, iv) => {
    const cipher = crypto.createCipheriv("aes-256-gcm", DATA_ENCRYPT_KEY, iv);
    const encrypted = cipher.update(data, 'utf8', 'base64');
    const finalEncrypt = encrypted + cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return { finalEncrypt, authTag };
}

exports.AESGCMDecryption = (finalEncrypt, authTag, iv) => {
    const decipher = crypto.createDecipheriv("aes-256-gcm", DATA_ENCRYPT_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = decipher.update(finalEncrypt, 'base64', 'utf8');
    const finalDecrypted = decrypted + decipher.final('utf8');
    return finalDecrypted;
}