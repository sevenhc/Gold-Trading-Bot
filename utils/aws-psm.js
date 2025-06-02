

const AWS = require('aws-sdk')

const ssmClient = new AWS.SSM();
exports.GetParametersFromAWS = async (paramname) => {
    return parameter = await ssmClient.getParameter({
        Name: paramname,
        WithDecryption: true,
    }).promise();
}