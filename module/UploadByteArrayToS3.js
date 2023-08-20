const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION,
});
const MassengersProfileImageS3 = new AWS.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRETE_ACCESS_KEY,
    }
});

module.exports = function uploadByteArrayToS3(bucketName, imageName, byteArray) {
    const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: byteArray,
        ACL: 'public-read', 
        ContentType: 'image/jpeg',
    };

    return new Promise((resolve, reject) => {
        MassengersProfileImageS3.upload(params, (err, data) => {
            if (err) {
                console.error('Error uploading image:', err);
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
}