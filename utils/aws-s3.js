const S3 = require("aws-sdk/clients/s3");


const uploadImageToS3 = async (files, tenantname) => {
    const s3 = new S3();

    const filestoupload = Object.keys(files).map(prop => {
        const file = files[prop][0];
        const ext = file.mimetype.split("/")[1];



        return {
            Bucket: S3,//process.env.AWS_BUCKET_NAME,
            Key: `${file.fieldname}s/${tenantname}.${ext}`,
            Body: file.buffer,
            // ACL: "public-read"
        }
    });

    return await Promise.all(filestoupload.map((filetoupload) => s3.upload(filetoupload).promise()));
}

const uploadAnalytics = async (data, type) => {
    const s3 = new S3();
    console.log("in analytics")
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();

    console.log("in analytics dates")

    return new Promise((resolve, reject) => {
        s3.putObject(
            {
                Body: JSON.stringify(data),
                Bucket: S3_BUCKET,
                Key: `analytics/${type}/${year}/${month}/${day}/${hour}/${new Date().toISOString()}.json`,
                ContentType: 'application/json; charset=utf-8',
            },
            (error, data) => {
                if (error) {
                    console.log('S3 UPLOAD ERROR : ', error)
                    return reject(error)
                }
                return resolve(data)
            }
        )
    })

    // return Promise(() => {
    //    return s3.upload({
    //         Bucket: S3_BUCKET,
    //         Key: `/analyutics/${type}/${year}/${month}/${day}/${hour}/${new Date().toISOString()}.json`,
    //         Body: JSON.stringify(data),
    //         contentType: 'application/json; charset=utf-8',
    //     }).promise()
    // });
}

module.exports = { uploadImageToS3, uploadAnalytics };

