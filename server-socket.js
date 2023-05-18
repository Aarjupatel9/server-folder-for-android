const express = require("express");
// var con = require("./mysqlconn");
const fs = require("fs");
const app = express();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
const { query, json } = require("express");
const { send } = require("process");
const { userInfo } = require("os");
const { MongoClient, ObjectId, Db } = require("mongodb");
const { exec } = require("child_process");

var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

const port = process.env.SOCKET_PORT;

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

//socket par
var http = require("http").Server(app);
var io = require("socket.io")(http);

var url = process.env.MONGODB_URL;
var mainDb;
var DbO;

console.log("url = ", process.env.MONGODB_URL);

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  mainDb = db;
  DbO = mainDb.db("massenger");
  console.log("after initialize DbO");
  funServerStartUpHandler();
});

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

serverStart();
function serverStart() {
  http.listen(port, function () {
    console.log("Server-socket listening at port %d", port);
  });
}

//for query handling
var socket_query_count = [];
var socket_query_count_counter = 0;
var socket_query_count_limit = 10000;

var reciept_query_count = [];
var reciept_query_count_counter = 0;
var reciept_query_count_limit = 10000;

var acknowledgement_count = [];
var acknowledgement_count_counter = 0;
var acknowledgement_count_limit = 10000;

//for massege handling
var socket_massege_count = [];
var socket_massege_count_counter = 0;
var socket_massege_count_limit = 10000;

var user_connection = [];
var user_connection_fast = [];
var user_connection_tmp1 = [];
var user_connection_counter = 0;

var user_connection_tmp1_fix = [];
user_connection_tmp1_fix[0] = 0;
user_connection_tmp1_fix[1] = 0;

const FCM = require("fcm-node");
const serverKey = process.env.FIREBASE_SERVERKEY;
const fcm = new FCM(serverKey);

function funServerStartUpHandler() {
  DbO.collection("user_info").updateOne(
    {},
    { $set: { onlineStatus: 0 } },
    (err, result) => {
      if (err) throw err;
      console.log(
        "funServerStartUpHandler || result.mofifiedCount : ",
        result.modifiedCount
      );
    }
  );

  // con.query(
  //   "update `user_info` set online_status='" + 0 + "'",
  //   function (err, result) {
  //     if (err) {
  //       console.log("err is ", err);
  //     }
  //   }
  // );
}

function sendPushNotification(user_id, massegeOBJ) {
  return new Promise(async function (resolve, reject) {
    console.log("sendPushNotification || massegeOBJ, ", massegeOBJ);
    console.log("sendPushNotification || massegeOBJ, ", massegeOBJ.CID);
    const result = await DbO.collection("login_info").findOne({
      _id: ObjectId(massegeOBJ.CID),
    });

    if (result != null) {
      console.log("sendPushNotification || result, ", result);
      console.log("sendPushNotification || result, ", result._id);
      console.log("sendPushNotification || result, ", result.tokenFCM);

      var message = {
        to: result.tokenFCM,
        data: {
          massege_from: user_id,
          massege_to: massegeOBJ.CID,
          massegeOBJ: massegeOBJ,
          massege_from_user_name: result.Name,
          massege_type: "1",
        },
        notification: {
          title: "Massenger",
          body: "You have Massege from " + result.Name,
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

    // con.query(
    //   "select * from `login_info` Where `user_id`='" + massegeOBJ.C_ID + "'",
    //   function (err, result) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       // console.log("result in f@sendPushNotification : ", result);
    //       if (result.length > 0) {
    //         con.query(
    //           "select * from `login_info` Where `user_id`='" + user_id + "'",
    //           function (err, result1) {
    //             if (err) {
    //               console.log(err);
    //             } else {
    //               const registrationToken = result[0].tokenFCM;
    //               var message = {
    //                 to: registrationToken,
    //                 data: {
    //                   massege_from: user_id,
    //                   massege_to: massegeOBJ.C_ID,
    //                   massegeOBJ: massegeOBJ,
    //                   massege_from_user_name: result1[0].name,
    //                   massege_type: "1",
    //                 },
    //                 notification: {
    //                   title: "Massenger",
    //                   body: "You have Massege from " + result1[0].name,
    //                 },
    //               };
    //               fcm.send(message, function (err, response) {
    //                 if (err) {
    //                   console.log("Something has gone wrong!" + err);
    //                   console.log("Respponse:! " + response);
    //                   reject(0);
    //                 } else {
    //                   console.log(
    //                     "Successfully sent with response: ",
    //                     response
    //                   );
    //                   resolve(1);
    //                 }
    //               });
    //             }
    //           }
    //         );
    //       } else {
    //         reject(2);
    //       }
    //     }
    //   }
    // );
  });
}

function removeUserSocketFromUserConnection(id) {
  for (var i = 0; i < user_connection.length; i++) {
    if (user_connection[i][1] != 0 && user_connection[i][2] == id) {
      var user_id = user_connection[i][0];
      user_connection[i] = user_connection_tmp1_fix;
      user_connection_fast[i] = 0;
      console.log(
        "removeUserSocketFromUserConnection || user: ",
        user_connection,
        " is disConected now"
      );
      funUpdateUserOnlineStatus(user_id, 0); //for remove online_status=0
    }
  }
}

setInterval(async function () {
  console.log("mongodb reset");
  const result = await DbO.collection("login_info").findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result in mongodb connection reset :", result);

  // console.log("mysqlconnection reset");
  // con = require("./mysqlconn");
  // con.query(
  //   "select * from login_info where user_id='0'",
  //   function (err, result) {
  //     if (err) {
  //       console.log("err", err);
  //     } else {
  //       // console.log("result in mysqlconnection reset :", result);
  //     }
  //   }
  // );
}, 900000);

function funUpdateUserOnlineStatus(user_id, online_status) {
  // console.log(
  //   "funUpdateUserOnlineStatus || user id: " + user_id,
  //   " , online status: " + online_status
  // );
  // var d = Date.now();
  // con.query(
  //   "update `user_info` set online_status='" +
  //     online_status +
  //     "', `last_online_time`='" +
  //     d +
  //     "' where user_id='" +
  //     user_id +
  //     "'",
  //   function (err, result) {
  //     if (err) {
  //       console.log("err is ", err);
  //     }
  //   }
  // );
}

function check_user_id(user_id) {
  for (var i = 0; i < user_connection.length; i++) {
    if (user_connection_fast[i] == user_id) {
      return 1;
    }
  }
  return 0;
}

function Check_newMassege(user_id) {
  // con.query(
  //   "select * from `massege` WHERE `receiver_id` ='" +
  //     user_id +
  //     "' and `r_update`='1'",
  //   function (err, result) {
  //     if (err) {
  //       console.log("err is ", err);
  //     } else {
  //       console.log(
  //         "Check_newMassege :user_id:" + user_id + ": row in result is ",
  //         result.length,
  //         " //for massege sending"
  //       );
  //       if (result.length > 0) {
  //         var requestCode = 1;
  //         io.sockets
  //           .in(user_id)
  //           .emit(
  //             "new_massege_from_server",
  //             socket_massege_count_counter,
  //             result,
  //             requestCode
  //           );
  //         // socket_massege_count[socket_massege_count_counter] = result;
  //         socket_massege_count_counter++;
  //       }
  //     }
  //   }
  // );
  // con.query(
  //   "select * from `massege` WHERE `sender_id` ='" +
  //     user_id +
  //     "' and `s_update`='1'",
  //   function (err, result) {
  //     if (err) {
  //       console.log("err is ", err);
  //     } else {
  //       console.log(
  //         "Check_newMassege :user_id:" + user_id + ": row in result is ",
  //         result.length,
  //         " //for view_status"
  //       );
  //       io.sockets
  //         .in(user_id)
  //         .emit("massege_reach_read_receipt", 3, user_id, result);
  //     }
  //   }
  // );
}

function connectWithBrodcastRooms(socket, userId) {
  const BrodcastId = userId + "_b1";

  //join to self brodcast rooms
  socket.join(BrodcastId);

  // join to user's other contact brodcast rooms
}

io.on("connection", function (socket) {
  // console.log("one user connected : " + socket.id);
  // console.log("token is : ", socket.handshake.auth);

  socket.on("join", function (user_id) {
    if (!check_user_id(user_id)) {
      socket.join(user_id); // We are using room of socket io
      connectWithBrodcastRooms(socket, user_id);

      funUpdateUserOnlineStatus(user_id, 1);
      user_connection_tmp1[0] = user_id;
      user_connection_tmp1[1] = Date.now();
      user_connection_tmp1[2] = socket.id;

      user_connection[user_connection_counter] = user_connection_tmp1;
      user_connection_fast[user_connection_counter] = user_id;
      user_connection_counter++;

      io.sockets.in(user_id).emit("join_acknowledgement", { status: 1 });
      console.log("join || connecting to room of user_id :", user_id);
    } else {
      //leaving exiting room
      socket.leave(user_id);
      //join with new one
      socket.join(user_id);
      funUpdateUserOnlineStatus(user_id, 1);
      // io.sockets.in(user_id).emit("join_acknowledgement", { status: 1 });
      console.log("already connected");
    }
    Check_newMassege(user_id);
  });

  socket.on("disconnect", function () {
    console.log("disconnect EVENT || socket.id : ", socket.id);
    removeUserSocketFromUserConnection(socket.id);
  });

  socket.on("massege_reach_at_join_time", function (data) {
    console.log("data in massege_reach_at_join_time is : ", data);
  });

  socket.on("massege_number_fetch", function (user_id, data, size) {
    console.log(
      "massege_sent_when_user_come_to_online data-size is : " +
        size +
        " data:" +
        data
    );

    for (let i = 0; i < size; i++) {
      var tmp = data[i];
      // console.log(
      //   "massege_sent_when_user_come_to_online || data : ",
      //   tmp["sender_id"],
      //   tmp["Chat_id"]
      // );
      // con.query(
      //   "select `massege_number`,`sender_id`, `receiver_id`, `chat_id` from `massege`  where `sender_id`='" +
      //     tmp["sender_id"] +
      //     "' and `receiver_id`='" +
      //     tmp["C_ID"] +
      //     "' and `chat_id`='" +
      //     tmp["Chat_id"] +
      //     "'",
      //   function (err, result) {
      //     if (err) {
      //       console.log(err);
      //     } else {
      //       if (result.length > 0) {
      //         io.sockets
      //           .in(user_id)
      //           .emit("massege_number_from_server", 2, user_id, result);
      //       }
      //     }
      //   }
      // );
    }
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

  socket.on("new_massege_acknowledgement", function (data) {
    var return_query_number = data.acknowledgement_id;
    console.log("new_massege_acknowledgement data : ", data);
    // console.log(
    //   "new_massege_acknowledgement data : ",
    //   socket_query_count[return_query_number]
    // );
    socket_query_count[return_query_number] = 0;
    // console.log(
    //   "new_massege_acknowledgement data : ",
    //   socket_query_count[return_query_number]
    // );
  });

  socket.on(
    "massege_reach_read_receipt_acknowledgement",
    function (Code, userId, data) {
      if (Code == 3) {
        var receiver_id = data.receiver_id;
        var sender_id = data.sender_id;
        var massege_sent_time = data.massege_sent_time;
        var View_Status = data.View_Status;

        console.log(
          "massege_reach_read_receipt_acknowledgement SID:" + sender_id
        );
        console.log(
          "massege_reach_read_receipt_acknowledgement RID:" + receiver_id
        );

        if (user_connection_fast.includes(sender_id)) {
          console.log(
            "massege_reach_read_receipt_acknowledgement || sent to sender"
          );
          io.sockets
            .in(sender_id)
            .emit("massege_reach_read_receipt", 1, View_Status, data); // notify to change viewStatus=? for sender
        }
        // con.query(
        //   "update `massege` set `View_Status`='" +
        //     View_Status +
        //     "', `r_update`='0', `s_update`='1', `localDatabase_Status`='1' where `massege_sent_time`='" +
        //     massege_sent_time +
        //     "'",
        //   function (err, result) {
        //     if (err) {
        //       console.log(
        //         "err accured while update massege parameters and values \n",
        //         err
        //       );
        //     }
        //   }
        // );
      }
    }
  );

  socket.on("new_massege_from_server_acknowledgement", function (data) {
    var user_login_id = data.user_login_id;
    var returnArray = data.returnArray;

    console.log(
      "new_massege_from_server_acknowledgement user_login_id : ",
      user_login_id + " returnArray : ",
      returnArray
    );
    returnArray.forEach((obj) => {
      var massege_number = obj["massege_number"];
      // update query
      // con.query(
      //   "update `massege` set `View_Status`='2',`r_update`='0',`s_update`='1', `localDatabase_Status`='1' where `massege_number`='" +
      //     massege_number +
      //     "'",
      //   function (err, result) {
      //     if (err) {
      //       console.log(
      //         "err accured while update massege parameters and values \n",
      //         err
      //       );
      //     }
      //   }
      // );
      // if (user_connection_fast.includes(obj["massege_number"])) {
      //   io.sockets
      //     .in(obj["massege_number"])
      //     .emit("massege_reach_read_receipt", 2, 2, { obj }); // notify to change viewStatus=2
      // }
    });
  });

  socket.on(
    "massege_sent_when_user_come_to_online",
    function (user_id, data, size) {
      console.log(
        "massege_sent_when_user_come_to_online data-size is : " + size
      );

      var massegeReturnData = [];
      for (let i = 0; i < size; i++) {
        var tmp = data[i];
        var CID = tmp["C_ID"];
        if (user_connection_fast.includes(CID)) {
          var requestCode = 3;
          io.sockets
            .in(CID)
            .emit(
              "new_massege_from_server",
              socket_massege_count_counter,
              tmp,
              requestCode
            );
          socket_massege_count[socket_massege_count_counter] = tmp;
          socket_massege_count_counter++;
        }
        console.log(
          "massege_sent_when_user_come_to_online || data : " + tmp["C_ID"],
          tmp["user_massege"],
          tmp["Chat_id"]
        );
        // con.query(
        //   "insert into `massege`(`sender_id`, `receiver_id`, `chat_id`, `massage`,`massege_sent_time`, `View_Status`, `localDatabase_Status`, `r_update`,`s_update`) VALUES ('" +
        //     tmp["sender_id"] +
        //     "','" +
        //     tmp["C_ID"] +
        //     "','" +
        //     tmp["Chat_id"] +
        //     "','" +
        //     tmp["user_massege"] +
        //     "','" +
        //     tmp["time_of_send"] +
        //     "','1', '0', '1', '0')",
        //   function (err, result) {
        //     if (err) {
        //       console.log(err);
        //     } else {
        //       if (result.affectedRows > 0) {
        //         console.log(
        //           "massege inserted succcessfully in massege_sent_when_user_come_to_online"
        //         );

        //         con.query(
        //           "select `massege_number`, `sender_id`, `receiver_id`, `chat_id` from `massege` where `sender_id`='" +
        //             tmp["sender_id"] +
        //             "' and `receiver_id`='" +
        //             tmp["C_ID"] +
        //             "' and `chat_id`='" +
        //             tmp["Chat_id"] +
        //             "' order by `chat_id` DESC limit 1 ",
        //           function (err, result1) {
        //             if (err) {
        //               console.log("err:", err);
        //             } else {
        //               io.sockets
        //                 .in(user_id)
        //                 .emit(
        //                   "massege_number_from_server",
        //                   1,
        //                   user_id,
        //                   result1
        //                 );
        //               if (user_connection_fast.includes(CID)) {
        //                 io.sockets
        //                   .in(CID)
        //                   .emit(
        //                     "massege_number_from_server",
        //                     1,
        //                     user_id,
        //                     result1
        //                   );
        //               }
        //             }
        //           }
        //         );
        //       }
        //     }
        //   }
        // );
        massegeReturnData[i] = tmp["Chat_id"];
      }
      io.sockets
        .in(user_id)
        .emit(
          "massege_sent_when_user_come_to_online_acknowledgement",
          user_id,
          massegeReturnData
        );
    }
  );

  socket.on("send_massege_to_server_from_CMDV", function (massegeOBJ, user_id) {
    console.log("massegeOBJ is : ", massegeOBJ + " from user_id:" + user_id);

    if (user_connection_fast.includes(massegeOBJ.CID)) {
      // console.log("contact is connected and online");
      var massegeDataObject = [];
      massegeDataObject["massegeOBJ"] = massegeOBJ;
      var requestCode = 3;
      io.sockets
        .in(massegeOBJ.CID)
        .emit(
          "new_massege_from_server",
          socket_massege_count_counter,
          massegeOBJ,
          requestCode
        );
      socket_massege_count_counter++;
    } else {
      // console.log(
      //   "user is not currentlly active with user_id : ",
      //   massegeOBJ.C_ID
      // );
      sendPushNotification(user_id, massegeOBJ)
        .then((result) => {
          console.log("push notification is sent to ", user_id);
        })
        .catch((err) => {
          console.log("push notification is not sent , err:", err);
        });
    }

    io.sockets
      .in(user_id)
      .emit(
        "send_massege_to_server_from_CMDV_acknowledgement",
        socket_massege_count_counter,
        massegeOBJ
      );
    massegeOBJ["requestCode"] = 6;

    // DbO.collection("massege").updateOne("");

    // con.query(
    //   "insert into `massege`(`sender_id`, `receiver_id`, `chat_id`, `massage`, `massege_sent_time`,`View_Status`,`localDatabase_Status`, `r_update`, `s_update`) VALUES ('" +
    //     user_id +
    //     "','" +
    //     massegeOBJ.C_ID +
    //     "','" +
    //     massegeOBJ.Chat_id +
    //     "','" +
    //     massegeOBJ.user_massege +
    //     "','" +
    //     massegeOBJ.time_of_send +
    //     "','1', '0','1','0')",
    //   function (err, result) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       if (result.affectedRows > 0) {
    //         console.log(
    //           "massege inserted succcessfully in send_massege_to_server_from_CMDV"
    //         );
    //         con.query(
    //           "select `massege_number`, `sender_id`, `receiver_id`, `chat_id` from `massege` where `sender_id`='" +
    //             user_id +
    //             "' and `receiver_id`='" +
    //             massegeOBJ.C_ID +
    //             "' and `chat_id`='" +
    //             massegeOBJ.Chat_id +
    //             "' order by `chat_id` DESC limit 1 ",
    //           function (err, result1) {
    //             if (err) {
    //               console.log("err:", err);
    //             } else {
    //               io.sockets
    //                 .in(user_id)
    //                 .emit("massege_number_from_server", 1, user_id, result1);
    //               if (user_connection_fast.includes(massegeOBJ.C_ID)) {
    //                 io.sockets
    //                   .in(massegeOBJ.C_ID)
    //                   .emit("massege_number_from_server", 1, user_id, result1);
    //               }
    //             }
    //           }
    //         );
    //       }
    //     }
    //   }
    // );
  });

  socket.on("massege_reach_receipt", function (data, user_id) {
    //comes when user read messege
    var requestCode = 4;
    io.sockets
      .in(user_id)
      .emit(
        "massege_reach_receipt_from_server",
        socket_massege_count_counter,
        tmp,
        requestCode
      );
    reciept_query_count[reciept_query_count_counter] = tmp;
    reciept_query_count_counter++;
  });

  socket.on("massege_reach_receipt_from_server", function (acknowledgement_id) {
    //acknowledgement massege_reach_reciept
  });

  socket.on(
    "massege_reach_receipt_acknowledgement",
    function (acknowledgement_id) {
      console.log("massege_reach_receipt_acknowledgement comes from device");

      //acknowledgement massege_reach_reciept
    }
  );

  socket.on("massege_read_reciept", function (data, user_id) {
    //comes when user read messege
  });

  socket.on(
    "massege_read_reciept_acknowledgement",
    function (acknowledgement_id) {
      //acknowledgement massege_reach_reciept
    }
  );

  socket.on("CheckContactOnlineStatus", function (user_id, contact_id) {
    //here we are updating our database with online status of user
    // console.log("CheckContactOnlineStatus is arive from ", user_id);
    // con.query(
    //   "select * from `user_info` where user_id='" + contact_id + "'",
    //   function (err, result) {
    //     if (err) {
    //       console.log("err is ", err);
    //     } else {
    //       // console.log("result is : ", result);
    //       if (result.length > 0) {
    //         var last_online_time = new Date(result[0].last_online_time);
    //         // console.log(
    //         //   "last online time is  s: ",
    //         //   last_online_time.toString()
    //         // );
    //         // console.log("last online time is  s: ", last_online_time.getTime());
    //         if (result[0].online_status_privacy == 0) {
    //           io.sockets
    //             .in(user_id)
    //             .emit(
    //               "CheckContactOnlineStatus_return",
    //               contact_id,
    //               result[0].online_status,
    //               last_online_time.getTime(),
    //               "contact"
    //             );
    //         } else if (result[0].online_status_privacy == 1) {
    //           io.sockets.in(user_id).emit(
    //             "CheckContactOnlineStatus_return",
    //             contact_id,
    //             result[0].online_status,
    //             last_online_time.getTime(),
    //             "private"
    //           );
    //         } else {
    //           console.log("enter in else cond.  +");
    //         }
    //         // console.log(
    //         //   "CheckContactOnlineStatus_return is sent to ",
    //         //   user_id,
    //         //   " wih staus : ",
    //         //   result[0].online_status
    //         // );
    //       }
    //     }
    //   }
    // );
  });

  socket.on("updateUserAboutInfo", function (user_id, about_info) {
    DbO.collection("user_info").updateOne(
      {
        _id: ObjectId(user_id),
      },
      { $set: { about: about_info } },
      (err, result) => {
        if (err) {
          console.log("err is ", err);
        } else {
          io.sockets.in(user_id).emit("updateUserAboutInfo_return", 1);
        }
      }
    );
  });

  socket.on("updateUserDisplayName", function (user_id, display_name) {
    DbO.collection("user_info").updateOne(
      {
        _id: ObjectId(user_id),
      },
      { $set: { display_name: display_name } },
      (err, result) => {
        if (err) {
          console.log("err is ", err);
        } else {
          io.sockets.in(user_id).emit("updateUserDisplayName_return", 1);
        }
      }
    );
  });

  socket.on(
    "getContactDetailsForContactDetailsFromMassegeViewPage",
    async function (user_id, contact_id) {
      console.log(
        "getContactDetailsForContactDetailsFromMassegeViewPage : start "
      );

      const result = await DbO.collection("user_info").find(
        { _id: ObjectId(contact_id) },
        { display_name: 1, about: 1 }
      );

      if (result != null) {
        console.log(
          "getContactDetailsForContactDetailsFromMassegeViewPage : result : ",
          result
        );
        console.log(
          "getContactDetailsForContactDetailsFromMassegeViewPage : result : ",
          result.display_name
        );
        console.log(
          "getContactDetailsForContactDetailsFromMassegeViewPage : result : ",
          result.about
        );

        io.sockets
          .in(user_id)
          .emit(
            "getContactDetailsForContactDetailsFromMassegeViewPage_return",
            contact_id,
            result.display_name,
            result.about
          );
      }
    }
  );
});
// var date = Date.now();
// console.log("date is : ", date);
// con.query(
//   "update `user_info` set online_status='" +
//     0 +
//     "', `last_online_time`='" +
//     date +
//     "' where user_id='" +
//     1 +
//     "'",
//   function (err, result) {
//     if (err) {
//       console.log("err is ", err);
//     }
//   }
// );

// con.query(
//   "select * from `user_info` where user_id='" + 1 + "'",
//   function (err, result) {
//     if (err) {
//       console.log("err is ", err);
//     } else {
//       console.log("result is : ", result);
//       if (result.length > 0) {
//         console.log("last online time is  s: ", result[0].last_online_time);
//         var kx = new Date(result[0].last_online_time);
//         console.log("last online time is  s: ", kx.toString());
//       }
//     }
//   }
// );

// var date = new Date(Date.now());
// last_online_time = new Date(date + 360000);

// console.log("date is : ", date);
// console.log("date is : ", date.toString());
// console.log("date is : ", last_online_time);
// console.log("date is : ", last_online_time.toString());

// const nDate = new Date().toLocaleString("en-US", {
//   timeZone: "Asia/Calcutta",
// });
// console.log(nDate);

//  //send massege afrter 5 sec for trial
//       setTimeout(() => {
//         console.log("in join event - send massege to : ", user_connection[0]);
//         var massegeDataObject = [];
//         var massege = "hello";
//         massegeDataObject["massege"] = "hello";
//         io.sockets
//           .in(user_connection[0])
//           .emit("new_msg", socket_query_count_counter, massege); //first paramerter for acknoledment perpose

//         socket_query_count[socket_query_count_counter] = massegeDataObject;
//         socket_query_count_counter++;

//         console.log("in join event - massege is sent");
//       }, 3000);

//get post area
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

async function SocketCommunicationMassegeSend(url, data) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}
