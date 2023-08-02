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
const socketLib = require("socket.io");

var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

const port = process.env.WEB_SOCKET_PORT;

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

const FCM = require("fcm-node");
const con = require("./mysqlconn.js");
const serverKey = process.env.FIREBASE_SERVERKEY;
const fcm = new FCM(serverKey);

//socket part
var http = require("http").Server(app);
var io = socketLib(http, {
  cors: {
    origin: "https://localhost:3000",
    allowedHeaders: ["token"],
    credentials: true
  }
});

const SERVER_ID = 1;

const mongoose = require("mongoose");
const loginModel = require("./mongodbModels/loginInfo.js");
const userModel = require("./mongodbModels/userInfo.js");
const massegesModel = require("./mongodbModels/masseges.js");

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((responce) => {
    console.log("Connected to MongoDB , ", responce.connection.name);
  })
  .catch((err) => console.log(err));

const clientInfo = {}


function serverStart() {
  http.listen(port, function () {
    console.log("Server-socket listening at port %d", port);
  });
}
serverStart();


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
  for (const key in clientInfo) {
    // console.log("key is : ", key);
    if (clientInfo[key][0] == socket_id) {
      delete clientInfo[key];
      return true;
    }
  }
  return false;
}

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
  console.log("on addClientInfo || start: ", token, " , ", socket_id);
  if (isClientConnected(token)) {
    const arr = getClientSocketId(token);
    console.log("on addClientInfo || isClientConnected arr : ", arr);
    if (server_id != SERVER_ID && arr[1] >= 1) {
      console.log("on addClientInfo || isClientConnected inside if condd");
      const receiverSocket = io.sockets.sockets.get(
        arr[0]
      );
      if (receiverSocket) {
        receiverSocket.emit("logoutEvent", 1);
      } else {
        console.log(
          "on addClientInfo || on logoutEvent receiverSocket is null"
        );
      }
      var obj = [];
      obj.push(socket_id);
      obj.push(server_id)
      clientInfo[token] = obj; // log in to mobile
      console.log("after inserting clientInfo of android over web");

      return;
    }
  }
  console.log("on addClientInfo || isClientConnected not");
  var obj1 = [];
  obj1.push(socket_id);
  obj1.push(server_id)
  clientInfo[token] = obj1;

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


// socket_local_client_instacnce.on("logoutEvent", (userId, socket_id, server_id) => {

//   console.log("logoutEvent event accure ");

//   const arr = getClientSocketId(userId);
//   if (arr != null) {
//     const receiverSocket = io.sockets.sockets.get(
//       arr[0]
//     );
//     if (receiverSocket) {
//       receiverSocket.emit("logoutEvent", 1);
//     } else {
//       console.log(
//         "socket_local_client_instacnce || on logoutEvent receiverSocket is null"
//       );
//     }
//   } else {
//     console.log(
//       "socket_local_client_instacnce || on logoutEvent arr is null"
//     );
//   }
// });


//socket experiment
app.get("/check", (req, res) => {
  console.log("/check || clientInfo : ", clientInfo);
  res.send({ clientInfo });
});

// app.get("/addClientInfo", (req, res) => {
//   const token = "token1";
//   const socket_id = "id1";
//   socket_local_client_instacnce.emit("addClientInfo", token, socket_id);
//   res.send({ status: 1 });
// });
// app.get("/removeClientInfo", (req, res) => {
//   const socket_id = "id1";
//   socket_local_client_instacnce.emit("removeClientInfo", socket_id);
//   res.send({ status: 1 });
// });


io.on("connection", (socket) => {
  socketClientInit(socket);


  socket.on("disconnect", function () {
    var uderId = socket.handshake.auth.id;

    funUpdateUserOnlineStatus(uderId);
    // removeClientFromClientInfo(socket.id);
    socket_local_client_instacnce.emit("removeClientInfo", socket.id);
    console.log(
      "disconnect EVENT || socket.id : ",
      socket.id,
      " || successfulyy removed"
    );
  });

  socket.on("test", function () {
    console.log("socket test arrive success");
  })
  socket.on(
    "massege_reach_read_receipt",
    async function (Code, userId, jsonArray) {

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
      } else {
        console.log("massege_reach_read_receipt unexcpected code || code ", Code);

      }

    }
  );


  socket.on(
    "send_massege_to_server_from_sender",
    async function (user_id, massegeOBJ) {
      if (massegeOBJ != null) {
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
          0,
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

            socket_local_client_instacnce.emit("sendEmitEvent", "new_massege_from_server", massegeOBJ.to, getClientSocketId(massegeOBJ.to), 0,
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

});


function getCookieValue(cookie, name) {
  const valueStartIndex = cookie.indexOf(`${name}=`);
  if (valueStartIndex === -1) {
    return null;
  }
  let valueEndIndex = cookie.indexOf(';', valueStartIndex);
  if (valueEndIndex === -1) {
    valueEndIndex = cookie.length;
  }
  return cookie.substring(valueStartIndex + name.length + 1, valueEndIndex);
}
function socketClientInit(socket) {

  var userId = socket.handshake.auth.id;
  var cookie = socket.handshake.headers.cookie;
  var extras = socket.handshake;
  const jwtValue = getCookieValue(cookie, 'jwt');

  if (userId != null) {

    var socket_id = socket.id;
    checkNewMassege(userId, socket);
    // funUpdateUserOnlineStatus(token, 1);
    if (isClientConnected(userId)) {
      console.log(
        "socketClientInit value is already inserted into clientInfo object"
      );
      socket.emit("logoutEvent", 1);
    } else {
      socket_local_client_instacnce.emit("addClientInfo", userId, socket_id, SERVER_ID);
      console.log(
        "socketClientInit || inserting into clientInfo object, socket.id : ",
        socket_id
      );
      // connectWithBrodcastRooms(socket, userId);
    }
  }
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
            socket.emit("new_massege_from_server", 1, msg, 0); //requestCode = 0 // and 1 is constant value
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
