
const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");
const otpModel = require("../mongodbModels/otpModel");

const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

const { uploadByteArrayToS3 } = require("../module/UploadByteArrayToS3");

exports.profile_displayName =  async (req, res) => {
    console.log("/profile/displayName || start-b", req.body.id);
    const user_id = req.body.id;
    const displayName = req.body.displayName;

    const result = await userModel.updateOne(
        {
            _id: ObjectId(user_id),
        },
        { $set: { displayName: displayName } }
    );

    console.log("updateUserDisplayName || result", result.modifiedCount);
    res.send({ status: 1 });
};

exports.profile_aboutInfo =async (req, res) => {
    console.log("/profile/displayName || start-b", req.body.id);
    const user_id = req.body.id;
    const about = req.body.about;

    const result = await userModel.updateOne(
        {
            _id: ObjectId(user_id),
        },
        { $set: { about: about } }
    );

    console.log("updateUserAboutInfo || result", result.modifiedCount);
    res.send({ status: 1 });
};

exports.profile_profileImage =  async (req, res) => {
    const user_id = req.body.id;
    // const imageData = req.body.byteArray;

    const rowImageData = req.body.byteArray;
    const byteArray = Object.values(rowImageData);
    const imageData = Buffer.from(byteArray);

    // console.log("/profile/profileImage || rowImageData : ", imageData);

    const result = await userModel.updateOne(
        {
            _id: ObjectId(user_id),
        },
        {
            $set: { ProfileImage: imageData },
            $inc: { ProfileImageVersion: 1 },
        }
    );
    console.log("updateUserProfileImage || result", result.modifiedCount);
    res.send({ status: result.modifiedCount });

    const bucketName = process.env.AWS_PROFILE_IMAGE_BUCKET_NAME;
    const imageName = user_id + ".jpg"; // Change this to your desired image name
    const imageLink = await uploadByteArrayToS3(bucketName, imageName, imageData);
    console.log('Image uploaded to S3. Public URL:', imageLink);
};