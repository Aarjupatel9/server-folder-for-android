const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const { exec } = require("child_process");
const cors = require("cors");

const port = process.env.SOCKET_PORT;

const encrypt = require("../module/vigenere_enc.js");
const decrypt = require("../module/vigenere_dec.js");

//socket part

const SERVER_ID = 0;

const mongoose = require("mongoose");
const loginModel = require("../mongodbModels/loginInfo");
const userModel = require("../mongodbModels/userInfo");
const massegesModel = require("../mongodbModels/masseges");

exports.contactBlockStatusChanged = async function (userId, contactId, status) {
  console.log(
    "contactBlockStatusChanged || start ",
    userId,
    " : ",
    contactId,
    " : ",
    status
  );

  try {
    const result = await userModel.updateOne(
      {
        _id: ObjectId(userId),
      },

      {
        $set: {
          "Contacts.$[elem].blocked": status,
        },
      },
      {
        arrayFilters: [{ "elem._id": { $eq: ObjectId(contactId) } }],
      }
    );
    console.log("contactBlockStatusChanged result : ", result);
  } catch (error) {
    console.error("contactBlockStatusChanged error: ", error);
  }
};

exports.updateImageProfile = async function (userId, jsonArray, Code) {
  console.log("updateProfileImages || start with code ", Code);
  console.log(
    "updateProfileImages || and jasonArray length : ",
    jsonArray.length
  );

  for (let index = 0; index < jsonArray.length; index++) {
    const data = jsonArray[index];
    var _id = data._id;
    var Number = data.Number;
    var ProfileImageVersion = data.ProfileImageVersion;

    const result = await userModel.findOne({
      _id: ObjectId(_id),
      ProfileImageVersion: { $gt: ProfileImageVersion },
    });
    if (result) {
      console.log("updateProfileImages || result inside is : ", result._id);

      const profileImageBinData = result.ProfileImage;
      const profileImageArray = Array.from(profileImageBinData);
      const profileImageBase64 = profileImageBinData.toString("base64");

      if (Code == 1) {
        socket.emit(
          "updateSingleContactProfileImage",
          userId,
          result._id,
          profileImageBase64,
          result.ProfileImageVersion
        );
      } else if (Code == 2) {
        socket.emit(
          "updateSingleContactProfileImageToUserProfilePage",
          userId,
          result._id,
          profileImageBase64,
          result.ProfileImageVersion
        );
      }
    } else {
      console.log(
        "updateProfileImages || image is already updated : ",
        _id,
        " and version : ",
        ProfileImageVersion
      );
    }
  }
};

exports.massegeReachReadReceiptAcknowledgement = async function (
  Code,
  userId,
  jsonArray
) {
  if (Code == 1) {
    //arrive from onMassegeReachReadReceipt listener with value 1
    console.log("massege_reach_read_receipt_acknowledgement || code " + 1);
    for (let index = 0; index < jsonArray.length; index++) {
      const data = jsonArray[index];
      var to = data.to;
      var from = data.from;
      var massege_sent_time = data.time;
      const result = await massegesModel.updateOne(
        {
          $or: [
            {
              user1: to,
              user2: from,
            },
            {
              user1: from,
              user2: to,
            },
          ],
        },

        {
          $set: {
            "massegeHolder.$[elem].ef1": 0,
          },
        },
        {
          arrayFilters: [{ "elem.time": { $eq: massege_sent_time } }],
        }
      );
      console.log(
        "massege_reach_read_receipt_acknowledgement || result : ",
        result
      );
    }
  }
};

exports.getContactDetailsForContactDetailsFromMassegeViewPage = async function (
  userId,
  CID,
  profileImageVersion
) {
  console.log(
    "getContactDetailsForContactDetailsFromMassegeViewPage : start contact_id : ",
    CID
  );

  const result = await userModel.findOne(
    { _id: ObjectId(CID) },
    { displayName: 1, about: 1, ProfileImageVersion: 1 }
  );

  if (result != null) {
    console.log(
      "getContactDetailsForContactDetailsFromMassegeViewPage : result : ",
      result.displayName
    );
    console.log(
      "getContactDetailsForContactDetailsFromMassegeViewPage : result : ",
      result.about
    );
    var ProfileImageUpdatable = 0;
    if (result.ProfileImageVersion > profileImageVersion) {
      ProfileImageUpdatable = 1;
    }

    socket.emit(
      "getContactDetailsForContactDetailsFromMassegeViewPage_return",
      CID,
      result.displayName,
      result.about,
      ProfileImageUpdatable
    );
  }
};
