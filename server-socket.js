const express = require("express");
const fs = require("fs");
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const { exec } = require("child_process");
const cors = require("cors");

var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

const port = process.env.SOCKET_PORT;

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

//socket part
var http = require("http").Server(app);
var io = require("socket.io")(http);

const SERVER_ID = 0;

const mongoose = require("mongoose");
const loginModel = require("./mongodbModels/loginInfo");
const userModel = require("./mongodbModels/userInfo");
const massegesModel = require("./mongodbModels/masseges");

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((responce) => {
    console.log("Connected to MongoDB , ", responce.connection.name);
  })
  .catch((err) => console.log(err));

http.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);

    exec("sudo lsof -t -i:10001", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return;
      }
      if (stdout) {
        console.log("Command stdout: ", stdout);
        exec("sudo kill -9 " + stdout, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error inner executing command: ${error}`);
            return;
          }
          if (stdout) {
            console.log("Command inner stdout: ", stdout);
            serverStart();
          }
          if (stderr) {
            console.log("Command inner stderr: ", stderr);
          }
        });
      }
      if (stderr) {
        console.log("Command stderr: ", stderr);
      }
    });
  } else {
    console.error(error);
  }
});

function serverStart() {
  http.listen(port, function () {
    console.log("Server-socket listening at port %d", port);
  });
}
serverStart();

//aws config
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


function uploadByteArrayToS3(bucketName, imageName, byteArray) {
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: byteArray,
    ACL: 'public-read', // Set this to 'private' if you want restricted access
    ContentType: 'image/jpeg', // Change the content type based on your image type
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


//for query handling
var socket_query_count = [];
//for massege handling
var socket_massege_count_counter = 0;
var user_connection = [];
var user_connection_tmp1_fix = [];
user_connection_tmp1_fix[0] = 0;
user_connection_tmp1_fix[1] = 0;

const FCM = require("fcm-node");
const con = require("./mysqlconn.js");
const serverKey = process.env.FIREBASE_SERVERKEY;
const fcm = new FCM(serverKey);

const clientInfo = {};



//local data sharing
const socket_client = require("socket.io-client");
const socket_local_client_instacnce = socket_client("http://localhost:10010");

socket_local_client_instacnce.on("connect", () => {
  console.log("Client connected to the socket server");
});

socket_local_client_instacnce.on("disconnect", () => {
  console.log("Client disconnected from the socket server");
});


socket_local_client_instacnce.on("addClientInfo", (token, socket_id, server_id) => {

  if (isClientConnected(token)) {
    console.log("addClientInfo || clientInfo is alredy inserted ");
    const arr = getClientSocketId(token);
    if (server_id != SERVER_ID) {
      if (arr[1] == 1) {
        console.log("on addClientInfo insidde if");
        const obj = [];
        obj.push(socket_id);
        obj.push(server_id)
        clientInfo[token] = obj;
        console.log(
          "addClientInfo || inserting into clientInfo object, socket.id insidde if : ",
          socket_id
        );
      }
      return;
    }
  }
  console.log("on addClientInfo ");
  const obj = [];
  obj.push(socket_id);
  obj.push(server_id)
  clientInfo[token] = obj;
  console.log(
    "addClientInfo || inserting into clientInfo object, socket.id : ",
    socket_id
  );

});
socket_local_client_instacnce.on("removeClientInfo", (socket_id) => {
  console.log("on removeClientInfo socket_id :  ", socket_id);
  var r = removeClientFromClientInfo(socket_id);
  console.log("result : ", r);
});

socket_local_client_instacnce.on("sendEmitEvent", (eventName, sendeTo, socketOBJ, ...data) => {
  console.log(
    "socket_local_client_instacnce || on sendEvent SERVER_ID : ", socketOBJ
  );
  if (socketOBJ[1] == SERVER_ID) {
    const arr = getClientSocketId(sendeTo);
    if (arr != null) {
      const receiverSocket = io.sockets.sockets.get(
        arr[0]
      );
      if (receiverSocket) {
        receiverSocket.emit(eventName, ...data);
      } else {
        console.log(
          "socket_local_client_instacnce || on sendEvent receiverSocket is null"
        );
      }
    }
  }
})


app.get("/check", (req, res) => {
  console.log("/check || clientInfo : ", clientInfo);
  res.send({ clientInfo });
});

//end of data sharing


async function funServerStartUpHandler() {
  exec("echo > ./debug_log.txt", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command rm: ${error}`);
      return;
    }
    if (stdout) {
      console.log("Command rm stdout : ", stdout);
    }
    if (stderr) {
      console.log("Command rm stderr: ", stderr);
    }
  });

  const result = await userModel.updateMany({}, { $set: { onlineStatus: 0 } });

  console.log(
    "funServerStartUpHandler || result.mofifiedCount : ",
    result.modifiedCount
  );
}

function sendPushNotification(user_id, massegeOBJ) {
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
}

setInterval(async function () {
  console.log("mongodb reset");
  const result = await loginModel.findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result in mongodb connection reset :", result);
}, 300000);

async function funUpdateUserOnlineStatus(user_id) {
  var d = Date.now();
  const result = await userModel.updateOne(
    { _id: user_id },
    { $set: { onlineStatus: d } }
  );

  console.log("funUpdateUserOnlineStatus || result : ", result.modifiedCount);
}

async function checkNewMassege(user_id, socket) {

  // update to android device for web sent masseges
  try {
    const result = await massegesModel.aggregate([
      {
        $match: {
          $or: [{ user1: user_id }, { user2: user_id }],
        },
      },
      {
        $project: {
          _id: 0,
          massegeHolder: {
            $filter: {
              input: "$massegeHolder",
              as: "msg",
              cond: {
                $and: [
                  { $eq: ["$$msg.from", user_id] },
                  { $eq: ["$$msg.elf1", 1] },
                ],
              },
            },
          },
        },
      },
    ]);
    console.log(
      "new massege fro android from web  same user result length is : ",
      result.length
    );
    if (result.length > 0) {
      result.forEach((doc) => {
        if (doc.massegeHolder && doc.massegeHolder != null)
          doc.massegeHolder.forEach((msg) => {
            console.log("checkNewMassegeStatusUpdate || massegeObj : ", msg);
            var requestCode = 1;
            socket.emit("new_massege_from_server", 1, msg, requestCode);
          });
      });
    }
  } catch (error) {
    console.error("Error while performing the aggregation:", error);
  }

  //for checking new massege fron contacts
  try {
    const result = await massegesModel.aggregate([
      {
        $match: {
          $or: [{ user1: user_id }, { user2: user_id }],
        },
      },
      {
        $project: {
          _id: 0,
          massegeHolder: {
            $filter: {
              input: "$massegeHolder",
              as: "msg",
              cond: {
                $and: [
                  { $eq: ["$$msg.to", user_id] },
                  { $eq: ["$$msg.ef2", 1] },
                ],
              },
            },
          },
        },
      },
    ]);
    console.log("result length is : ", result.length);
    if (result.length > 0) {
      result.forEach((doc) => {
        if (doc.massegeHolder && doc.massegeHolder != null)
          doc.massegeHolder.forEach((msg) => {
            console.log("checkNewMassege || massegeObj : ", msg);
            var requestCode = 0;
            socket.emit("new_massege_from_server", 1, msg, requestCode); //requestCode = 0 // and 1 is constant value
          });
      });
    }
  } catch (error) {
    console.error("Error while performing the aggregation:", error);
  }

  // for checking massegeStatus update
  try {
    const result = await massegesModel.aggregate([
      {
        $match: {
          $or: [{ user1: user_id }, { user2: user_id }],
        },
      },
      {
        $project: {
          _id: 0,
          massegeHolder: {
            $filter: {
              input: "$massegeHolder",
              as: "msg",
              cond: {
                $and: [
                  { $eq: ["$$msg.from", user_id] },
                  { $eq: ["$$msg.ef1", 1] },
                ],
              },
            },
          },
        },
      },
    ]);
    console.log(
      "checkNewMassegeStatusUpdate result length is : ",
      result.length
    );
    if (result.length > 0) {
      result.forEach((doc) => {
        if (doc.massegeHolder && doc.massegeHolder != null)
          doc.massegeHolder.forEach((msg) => {
            console.log("checkNewMassegeStatusUpdate || massegeObj : ", msg);
            socket.emit("massege_reach_read_receipt", 1, msg); //requestCode = 1
          });
      });
    }
  } catch (error) {
    console.error("Error while performing the aggregation:", error);
  }




}

function connectWithBrodcastRooms(socket, userId) {
  const BrodcastId = userId + "_b1";

  //join to self brodcast rooms
  socket.join(BrodcastId);

  console.log("connectWithBrodcastRooms || end");

  // join to user's other contact brodcast rooms
}

function isClientConnected(token) {
  // console.log("isClientConnected || clinetInfo : ", clientInfo);
  if (clientInfo.hasOwnProperty(token)) {
    return true;
  } else {
    return false;
  }
}
function getClientSocketId(token) {
  return clientInfo[token];
}

function removeClientFromClientInfo(socket_id) {
  console.log("removeClientFromClientInfo || clinetInfo : ", clientInfo);
  for (const key in clientInfo) {
    if (clientInfo[key][0] == socket_id) {
      delete clientInfo[key];
      return true;
    }
  }
  return false;
}
async function fUpdateUserDetails(userId, socket) {
  const result = await userModel.findOne({ _id: userId }, { about: 1, displayName: 1 });
  console.log("fUpdateUserDetails || result : ", result);
  socket.emit(
    "update_displayName_and_about",
    result.displayName,
    result.about,
  );
}

function socketClientInit(socket) {
  console.log("socketClientInit connect EVENT || socket.id : ", socket.id);
  console.log("socketClientInit connect EVENT || handshack : ", socket.handshake);

  var combine = socket.handshake.auth.token;
  var apiKey = combine.slice(0, 64);
  var token = combine.slice(64);
  var socket_id = socket.id;
  checkNewMassege(token, socket);//check new massege as well as massegeStatus have to be updated
  funUpdateUserOnlineStatus(token, 1);
  fUpdateUserDetails(token, socket);//displayName and about

  socket_local_client_instacnce.emit("addClientInfo", token, socket_id, SERVER_ID);
  connectWithBrodcastRooms(socket, token);
}

io.on("connection", function (socket) {
  socketClientInit(socket);

  socket.on("disconnect", function () {
    var combine = socket.handshake.auth.token;
    var apiKey = combine.slice(0, 64);
    var token = combine.slice(64);
    // console.log("disconnect combine is : ", combine);
    // console.log("disconnect token is : ", token);
    funUpdateUserOnlineStatus(token);
    // removeClientFromClientInfo(socket.id);
    socket_local_client_instacnce.emit("removeClientInfo", socket.id);
    console.log(
      "disconnect EVENT || socket.id : ",
      socket.id,
      " || successfulyy removed"
    );
  });

  socket.on("massege_reach_at_join_time", function (data) {
    console.log("data in massege_reach_at_join_time is : ", data);
  });

  socket.on("user_app_connected_status", function (data) {
    for (var i = 0; i < user_connection.length; i++) {
      if (user_connection[i][0] == data.user_id) {
        // console.log("user_app_connected_status msg arrive: ", data);
        // console.log("user conection main object ", user_connection, " and diff time : ", user_connection[i][1]);
        user_connection[i][1] = Date.now();
        return;
      }
    }
  });

  socket.on(
    "send_massege_to_server_from_sender",
    async function (user_id, jasonArray) {
      for (let i = 0; i < jasonArray.length; i++) {
        var massegeOBJ = jasonArray[i];
        console.log(
          "send_massege_to_server_from_sender || user_id ",
          user_id,
          " == from : ",
          massegeOBJ.from,
          " == to : ",
          massegeOBJ.to
        );

        massegeOBJ.ef1 = 0;
        massegeOBJ.ef2 = 1;
        massegeOBJ.massegeStatus = 1;
        // send acknoledgment to sender
        socket.emit(
          "send_massege_to_server_from_sender_acknowledgement",
          socket_massege_count_counter,
          massegeOBJ
        );

        if (massegeOBJ.to == user_id) {
          massegeOBJ.ef2 = 0;
        } else {
          // if receiver is online then send massege imidiatley
          if (isClientConnected(massegeOBJ.to)) {
            console.log(
              "send_massege_to_server_from_sender || connected and send massege"
            );

            socket_local_client_instacnce.emit("sendEmitEvent", "new_massege_from_server", massegeOBJ.to, getClientSocketId(massegeOBJ.to), socket_massege_count_counter,
              massegeOBJ,
              0); // first 3 args is fixed and other taken as array

          } else {
            sendPushNotification(user_id, massegeOBJ)
              .then((result) => {
                console.log("push notification is sent to ", user_id);
              })
              .catch((err) => {
                console.log("push notification is not sent , err:", err);
              });
          }
        }

        //insert massege into database
        const result = await massegesModel.updateOne(
          {
            $or: [
              { user1: massegeOBJ.from, user2: massegeOBJ.to },
              { user1: massegeOBJ.to, user2: massegeOBJ.from },
            ],
          },
          { $push: { massegeHolder: massegeOBJ } },
          {
            upsert: false,
          }
        );
        if (result.matchedCount > 0) {
          // Condition was matched
          if (result.modifiedCount > 0) {
            // Document was updated
            console.log("Document updated successfully.");
          } else {
            // Document was not updated (the object was already present in the array)
            console.log("Document was not updated.");
          }
        } else {
          // Condition was not matched (new document was created due to upsert)
          console.log("New document created.");
        }
      }
    }
  );

  socket.on("new_massege_acknowledgement", function (data) {
    var return_query_number = data.acknowledgement_id;
    console.log("new_massege_acknowledgement data : ", data);
  });

  socket.on(
    "massege_reach_read_receipt",
    async function (Code, userId, jsonArray) {
      //after massege reach to receiver this reciept is send back to server from receiver
      if (Code == 3) {
        // arrive from  new_massege_from_server listener
        for (let index = 0; index < jsonArray.length; index++) {
          const data = jsonArray[index];
          var to = data.to;
          var from = data.from;
          var massege_sent_time = data.time;
          var massegeStatus = data.massegeStatus;
          console.log(
            "massege_reach_read_receipt from:" + from + " , to:" + to
          );

          var ef1 = 0;
          if (from != userId) {
            ef1 = 1;
            if (isClientConnected(from)) {
              console.log(
                "massege_reach_read_receipt || sent to sender : ",
                from
              );
              //brodcast to all server to send to user
              socket_local_client_instacnce.emit("sendEmitEvent", "massege_reach_read_receipt", from, getClientSocketId(from), 1, data); // first 3 args is fixed and other taken as array

            }
          }
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
                "massegeHolder.$[elem].ef1": ef1,
                "massegeHolder.$[elem].ef2": 0,
                "massegeHolder.$[elem].massegeStatus": massegeStatus,
              },
            },
            {
              arrayFilters: [{ "elem.time": { $eq: massege_sent_time } }],
            }
          );
          console.log("massege_reach_read_receipt code 3 || result : ", result);
        }
      } else if (Code == 4) {
        // arrive from updateMassegeToServerWithViewStatus fumction of MassegeListAdepter
        for (let index = 0; index < jsonArray.length; index++) {
          const data = jsonArray[index];
          var to = data.to;
          var from = data.from;
          var massege_sent_time = data.time;
          var massegeStatus = data.massegeStatus;
          console.log(
            "massege_reach_read_receipt from:" + from + " , to:" + to
          );

          var ef1 = 0;
          if (from != userId) {
            ef1 = 1;
            if (isClientConnected(from)) {
              console.log(
                "massege_reach_read_receipt || sent to sender : ",
                from
              );

              socket_local_client_instacnce.emit("sendEmitEvent", "massege_reach_read_receipt", from, getClientSocketId(from), 1, data); // first 3 args is fixed and other taken as array
              // notify to change viewStatus=? for sender

            }
          }
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
                "massegeHolder.$[elem].ef1": ef1,
                "massegeHolder.$[elem].massegeStatus": massegeStatus,
              },
            },
            {
              arrayFilters: [{ "elem.time": { $eq: massege_sent_time } }],
            }
          );
          console.log("massege_reach_read_receipt code 4 || result : ", result);
        }
      } else if (Code == 1) {

        for (let index = 0; index < jsonArray.length; index++) {
          const data = jsonArray[index];
          var to = data.to;
          var from = data.from;
          var massege_sent_time = data.time;
          console.log(
            "massege_reach_read_receipt code 1, from:" + from + " , to:" + to
          );
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
                "massegeHolder.$[elem].elf1": ef1,
              },
            },
            {
              arrayFilters: [{ "elem.time": { $eq: massege_sent_time } }],
            }
          );
          console.log("massege_reach_read_receipt code 1 || result : ", result);
        }
      }
    }
  );

  socket.on(
    "massege_reach_read_receipt_acknowledgement",
    async function (Code, userId, jsonArray) {
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
    }
  );

  socket.on("updateProfileImages", async function (userId, jsonArray, Code) {
    console.log("updateProfileImages || start with code ", Code);
    console.log(
      "updateProfileImages || and jasonarray lenght : ",
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
  });

  socket.on("contact_massege_typing_event", async function (userId, CID) {
    // console.log("contact_massege_typing_event for CID : ", CID);
    if (CID == "-1") {
      return;
    }

    if (isClientConnected(CID)) {

      socket_local_client_instacnce.emit("sendEmitEvent", "contact_massege_typing_event", CID, getClientSocketId(CID), userId, CID); // first 3 args is fixed and other taken as array

    } else {
      console.log("contact_massege_typing_event || isClientConnected  false");
    }
  });

  socket.on("CheckContactOnlineStatus", async function (userId, CID) {
    // console.log("CheckContactOnlineStatus for CID : ", CID);
    if (CID == "-1") {
      return;
    }
    const result = await userModel.findOne(
      { _id: ObjectId(CID) },
      { onlineStatus: 1, onlineStatusPolicy: 1 }
    );
    var online_status_policy;
    if (result) {
      if (result.onlineStatusPolicy) {
        online_status_policy = result.onlineStatusPolicy;
      } else {
        online_status_policy = 1;
      }
      if (isClientConnected(CID)) {
        socket.emit(
          "CheckContactOnlineStatus_return",
          userId,
          CID,
          online_status_policy,
          result.onlineStatus,
          1
        );
      } else {
        if (result.onlineStatus) {
          socket.emit(
            "CheckContactOnlineStatus_return",
            userId,
            CID,
            online_status_policy,
            result.onlineStatus,
            0
          );
        }
      }
    }
  });

  socket.on("updateUserAboutInfo", async function (user_id, about_info) {
    const result = await userModel.updateOne(
      {
        _id: ObjectId(user_id),
      },
      { $set: { about: about_info } }
    );

    console.log("updateUserAboutInfo || result", result.modifiedCount);
    socket.emit("updateUserAboutInfo_return", 1);

  });

  socket.on("updateUserDisplayName", async function (user_id, displayName) {
    const result = await userModel.updateOne(
      {
        _id: ObjectId(user_id),
      },
      { $set: { displayName: displayName } }
    );
    console.log("updateUserDisplayName || result", result);
    socket.emit("updateUserDisplayName_return", 1);
  });
  socket.on("updateUserProfileImage", async function (user_id, imageData) {
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
    console.log('Image uploaded to S3. Public URL:', imageLink);
  });

  socket.on(
    "getContactDetailsForContactDetailsFromMassegeViewPage",
    async function (userId, CID, profileImageVersion) {
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
    }
  );
});

app.post("/", (req, res) => {
  console.log(req);
  res.send({ name: "aarju" });
});

app.get("/getUserDetails", (req, res) => {
  con.query(
    "select * from `login_info` where `user_id`='1'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("result in /getUserdetsils ", result);
        var jd = JSON.stringify(result);
        res.send(jd);
      }
    }
  );
});

app.get("/", (req, res) => {
  con.query(
    "select * from `massege` where `receiver_id`='2'",
    function (err, result) {
      if (err) {
        console.log("errr in / ", err);
      } else {
        console.log("result in / ", result);
        var jd = JSON.stringify(result);

        setTimeout(() => {
          res.send(jd);
        }, 1000);
        // res.send(jd);
      }
    }
  );
});

app.get("/removeMassege", async (req, res) => {
  const time = req.query.time;
  const uid1 = req.query.uid1;
  const uid2 = req.query.uid2;

  const timeNumeric = parseInt(time, 10);

  if (!time || !uid) {
    res.send({ error: "parameter is invalid" });
    return;
  }
  console.log(
    " API || /removeMassege || parameter uid : ",
    uid1,
    " and time : ",
    timeNumeric
  );

  const arr = [];
  arr.push(uid1);
  arr.push(uid2);

  const result = await massegesModel.updateMany(
    {
      user1: { $in: arr },
      user2: { $in: arr },
    },
    {
      $pull: {
        massegeHolder: {
          time: { $lte: timeNumeric },
        },
      },
    }
  );

  if (result.modifiedCount > 0) {
    // Update was successful, handle accordingly
    console.log(
      ` API || /removeMassege || Updated ${result.modifiedCount} documents.`
    );
  } else {
    // No documents were modified, handle accordingly
    console.log("API || /removeMassege ||  No documents were modified.");
  }

  res.send({ result: result });
});
app.get("/updateMassege", async (req, res) => {
  const result = await massegesModel.updateOne(
    {
      _id: ObjectId("646094f995ce9ebfa09c968c"),
      "Contacts._id": ObjectId("64611c536a3d379e4a06469b"),
      "Contacts.massegeHolder.time": 1684674564716,
    },
    {
      $set: {
        "Contacts.$.massegeHolder.$[message].massege": "have is changed",
      },
    },
    {
      arrayFilters: [{ "message.time": 1684674564716 }],
    }
  );

  if (result.modifiedCount > 0) {
    // Update was successful, handle accordingly
    console.log(
      ` API || /updateMassege || Updated ${result.modifiedCount} documents.`
    );
  } else {
    // No documents were modified, handle accordingly
    console.log("API || /updateMassege ||  No documents were modified.");
  }

  res.send({ result: result });
});
