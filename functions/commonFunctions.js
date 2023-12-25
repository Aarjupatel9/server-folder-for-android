const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const { exec } = require("child_process");
const cors = require("cors");

const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

//socket part

const SERVER_ID = 0;

const mongoose = require("mongoose");
const loginModel = require("../mongodbModels/loginInfo.js");
const userModel = require("../mongodbModels/userInfo.js");
const massegesModel = require("../mongodbModels/masseges.js");

const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.AWS_REGION,
});
const MassengersProfileImageS3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRETE_ACCESS_KEY,
  },
});

exports.funUpdateUserOnlineStatus = async function (user_id) {
  var d = Date.now();
  const result = await userModel.updateOne(
    { _id: user_id },
    { $set: { onlineStatus: d } }
  );
  console.log("funUpdateUserOnlineStatus || result : ", result.modifiedCount);
};

exports.sendPushNotification = async function (user_id, massegeOBJ) {
  return new Promise(async function (resolve, reject) {
    console.log("sendPushNotification || massegeOBJ, ", massegeOBJ);
    console.log("sendPushNotification || massegeOBJ, ", massegeOBJ.to);
    const result = await loginModel.findOne({
      _id: ObjectId(massegeOBJ.to),
    });

    if (result != null) {
      console.log("sendPushNotification || result, ", result);
      console.log("sendPushNotification || result, ", result._id);
      console.log("sendPushNotification || result, ", result.tokenFCM);

      const result1 = await loginModel.findOne(
        {
          _id: ObjectId(massegeOBJ.from),
        },
        { Number: 1, Name: 1 }
      );
      var senderName;
      if (result1.Name == null) {
        senderName = result1.Number;
      } else {
        senderName = result1.Name;
      }

      var message = {
        to: result.tokenFCM,
        data: {
          massege_from: user_id,
          massege_to: massegeOBJ.to,
          massegeOBJ: massegeOBJ,
          massege_from_user_name: senderName,
          massege_type: "1",
          massege_from_user_number: result1.Number,
        },
        notification: {
          title: "Massenger",
          body: "You have Massege from " + senderName,
        },
      };
      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!" + err);
          console.log("Respponse:! " + response);
          reject(0);
        } else {
          console.log("Successfully sent with response: ", response);
          resolve(1);
        }
      });
    } else {
      reject(2);
    }
  });
};

exports.fUpdateUserDetails = async function (userId, socket) {
  const result = await userModel.findOne(
    { _id: userId },
    { about: 1, displayName: 1 }
  );
  console.log("fUpdateUserDetails || result : ", result);
  if (result) {
    socket.emit(
      "update_displayName_and_about",
      result.displayName,
      result.about
    );
  }
};

exports.updateUserAboutInfo = async function (user_id, about_info) {
  const result = await userModel.updateOne(
    {
      _id: ObjectId(user_id),
    },
    { $set: { about: about_info } }
  );

  console.log("updateUserAboutInfo || result", result.modifiedCount);
  socket.emit("updateUserAboutInfo_return", 1);
};

exports.updateUserDisplayName = async function (user_id, displayName) {
  const result = await userModel.updateOne(
    {
      _id: ObjectId(user_id),
    },
    { $set: { displayName: displayName } }
  );
  console.log("updateUserDisplayName || result", result);
  socket.emit("updateUserDisplayName_return", 1);
};

exports.updateUserProfileImage = async function (user_id, imageData) {
  // console.log("updateUserProfileImage || imageData", imageData)
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
  socket.emit("updateUserProfileImage_return", 1);

  const bucketName = process.env.AWS_PROFILE_IMAGE_BUCKET_NAME;
  const imageName = user_id + ".jpg"; // Change this to your desired image name
  const imageLink = await uploadByteArrayToS3(bucketName, imageName, imageData);
  console.log("Image uploaded to S3. Public URL:", imageLink);
};

function uploadByteArrayToS3(bucketName, imageName, byteArray) {
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: byteArray,
    ACL: "public-read", // Set this to 'private' if you want restricted access
    ContentType: "image/jpeg", // Change the content type based on your image type
  };

  return new Promise((resolve, reject) => {
    MassengersProfileImageS3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading image:", err);
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}
