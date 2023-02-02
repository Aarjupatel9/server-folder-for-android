const express = require("express");
var con = require("./mysqlconn");
const fs = require("fs");
const app = express();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
const { query, json } = require("express");
const { send } = require("process");
const { userInfo } = require("os");
var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

var counter = 0;
const port = process.env.SOCKET_PORT;

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

//socket par

var http = require("http").Server(app);
var io = require("socket.io")(http);

// http.listen(port, "192.168.43.48", function () {
//   console.log("Server listening at port %d", port);
// });
http.listen(port, function () {
  console.log("Server-socket listening at port %d", port);
});
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

var FCM = require("fcm-node");
var serverKey = process.env.FIREBASE_SERVERKEY;
var fcm = new FCM(serverKey);

function sendPushNotification(user_id, massegeOBJ) {
  return new Promise(function (resolve, reject) {
    con.query(
      "select * from `login_info` Where `user_id`='" + massegeOBJ.C_ID + "'",
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log("result in f@sendPushNotification : ", result);
          if (result.length > 0) {
            con.query(
              "select * from `login_info` Where `user_id`='" + user_id + "'",
              function (err, result1) {
                if (err) {
                  console.log(err);
                } else {
                  const registrationToken = result[0].tokenFCM;
                  var message = {
                    to: registrationToken,
                    data: {
                      massege_from: user_id,
                      massege_to: massegeOBJ.C_ID,
                      massegeOBJ: massegeOBJ,
                      massege_from_user_name: result1[0].name,
                      massege_type: "1",
                    },
                    notification: {
                      title: "Massenger",
                      body: "You have Massege from " + result1[0].name,
                    },
                  };
                  fcm.send(message, function (err, response) {
                    if (err) {
                      console.log("Something has gone wrong!" + err);
                      console.log("Respponse:! " + response);
                      reject(0);
                    } else {
                      console.log(
                        "Successfully sent with response: ",
                        response
                      );
                      resolve(1);
                    }
                  });
                }
              }
            );
          } else {
            reject(2);
          }
        }
      }
    );
  });
}

setInterval(function () {
  for (var i = 0; i < user_connection.length; i++) {
    if (
      user_connection[i][1] != 0 &&
      user_connection[i][1] + 3500 < Date.now()
    ) {
      var user_id = user_connection[i][0];
      user_connection[i] = user_connection_tmp1_fix;
      user_connection_fast[i] = 0;
      console.log("setInterval || user: ", user_connection, " is dicconected now");
      funUpdateUserOnlineStatus(user_id);
    }
  }
}, 2000);

setInterval(function () {
  console.log('mysqlconnection reset');
  con = require("./mysqlconn");
}, 900000);

function funUpdateUserOnlineStatus(user_id) {
  const online_status = 0;
  var d = Date.now();
  var last_online_time = new Date(d);
  // console.log("date is : ", d);
  // console.log("date is : ", last_online_time.toString());
  con.query(
    "update `user_info` set online_status='" +
      online_status +
      "', `last_online_time`='" +
      d +
      "' where user_id='" +
      user_id +
      "'",
    function (err, result) {
      if (err) {
        console.log("err is ", err);
      }
    }
  );
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
  con.query(
    "select * from `massege` WHERE `receiver_id` ='" +
      user_id +
      "' and `View_status`='0'",
    function (err, result) {
      if (err) {
        console.log("err is ", err);
      } else {
        console.log(
          "Check_newMassege :user_id:" + user_id + ": row in result is ",
          result.length
        );
        var requestCode = 1;
        io.sockets
          .in(user_id)
          .emit(
            "new_massege_from_server",
            socket_massege_count_counter,
            result,
            requestCode
          );
        // socket_massege_count[socket_massege_count_counter] = result;
        socket_massege_count_counter++;
      }
    }
  );
}

io.on("connection", function (socket) {
  // console.log("one user connected : " + socket.id);
  // console.log("token is : ", socket.handshake.auth);

  socket.on("join", function (user_id) {
    if (!check_user_id(user_id)) {
      socket.join(user_id); // We are using room of socket io

      user_connection_tmp1[0] = user_id;
      user_connection_tmp1[1] = Date.now();

      user_connection[user_connection_counter] = user_connection_tmp1;
      user_connection_fast[user_connection_counter] = user_id;
      user_connection_counter++;

      io.sockets.in(user_id).emit("join_acknowledgement", { status: 1 });
      console.log(
        "in join event- conneting first time - user_id is :",
        user_id
      );
      console.log("connecting new user user_id : ", user_id);
    } else {
      //leaving exiting room
      socket.leave(user_id);
      //join with new one
      socket.join(user_id);
      io.sockets.in(user_id).emit("join_acknowledgement", { status: 1 });
      console.log("already connected");
    }
    Check_newMassege(user_id);
  });

  socket.on('disconnect', function () {
    console.log('Got disconnect!');
  });

  socket.on("Disconnect_socket_connection", function (user_id) {
    console.log(
      "Disconnect_socket_connection Request come with user_id: ",
      user_id
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

  socket.on("new_massege_from_server_acknowledgement3", function (data) {
    var user_login_id = data.user_login_id;
    var massege_sent_time = data.massege_sent_time;
    console.log(
      "new_massege_from_server_acknowledgement3 user_login_id : ",
      user_login_id
    );
    console.log(
      "new_massege_from_server_acknowledgement3 massege_sent_time : ",
      massege_sent_time
    );
    con.query(
      "update `massege` set `View_Status`='1', `localDatabase_Status`='1' where `massege_sent_time`='" +
        massege_sent_time +
        "'",
      function (err, result) {
        if (err) {
          console.log(
            "err accured while update massege parameters and values \n",
            err
          );
        }
      }
    );
  });
  socket.on("new_massege_from_server_acknowledgement", function (data) {
    var user_login_id = data.user_login_id;
    var returnArray = data.returnArray;
    console.log(
      "new_massege_from_server_acknowledgement user_login_id : ",
      user_login_id
    );
    console.log(
      "new_massege_from_server_acknowledgement returnArray : ",
      returnArray
    );
    returnArray.forEach((element) => {
      console.log(element);
      // update query
      con.query(
        "update `massege` set `View_Status`='1', `localDatabase_Status`='1' where `massege_number`='" +
          element +
          "'",
        function (err, result) {
          if (err) {
            console.log(
              "err accured while update massege parameters and values \n",
              err
            );
          }
        }
      );
    });
  });

  socket.on(
    "new_massege_from_server_acknowledgement1",
    function (acknoledgement_id) {
      console.log(
        "new_massege_from_server_acknowledgement1 id is : ",
        acknoledgement_id
      );

      var result = socket_massege_count[acknoledgement_id];
      // console.log("data in result is : ", result);
      for (let i = 0; i < result.length; i++) {
        console.log("data in result is : ", result[i]);
        //we have to update massege_status for every column
        con.query(
          "Update `massege` set `View_status`='1' where `massege_number`='" +
            result[i].massege_number +
            "'",
          function (err, result1) {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    }
  );

  socket.on(
    "massege_have_to_sent_at_comeTOOnline_to_server",
    function (data, size, user_id) {
      console.log(
        "massege_have_to_sent_at_comeTOOnline_to_server data-size is : " + size
      );

      var contact_ids_in_masseges = [];
      var contact_ids_in_masseges_counter = 0;
      for (let i = 0; i < size; i++) {
        var tmp = data[i];

        if (user_connection.includes(user_id)) {
          // contact_ids_in_masseges[contact_ids_in_masseges_counter] = user_id;
          // contact_ids_in_masseges_counter++;
          var requestCode = 2;
          io.sockets
            .in(user_id)
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
          "massege_have_to_sent_at_comeTOOnline_to_server data is : " +
            tmp["C_ID"]
        );
        console.log(
          "massege_have_to_sent_at_comeTOOnline_to_server data is : " +
            tmp["user_massege"]
        );
        console.log(
          "massege_have_to_sent_at_comeTOOnline_to_server data is : " +
            tmp["Chat_id"]
        );
        con.query(
          "insert into `massege`(`sender_id`, `receiver_id`, `chat_id`, `massage`, `View_Status`) VALUES ('" +
            tmp["sender_id"] +
            "','" +
            tmp["C_ID"] +
            "','" +
            tmp["Chat_id"] +
            "','" +
            tmp["user_massege"] +
            "','0')",
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
              if (result.affectedRows > 0) {
                console.log(
                  "massege inserted succcessfully in send_massege_to_server_from_CMDV"
                );
              }
            }
          }
        );
      }
      var status = 1;
      io.sockets
        .in(user_id)
        .emit(
          "massege_have_to_sent_at_comeTOOnline_to_server_acknowledgement",
          status
        );
    }
  );

  socket.on("send_massege_to_server_from_CMDV", function (massegeOBJ, user_id) {
    console.log("massegeOBJ is : ", massegeOBJ + " from user_id:" + user_id);

    //if user's room is available then send masege to them
    if (user_connection_fast.includes(massegeOBJ.C_ID)) {
      console.log("contact is connected and online");
      var massegeDataObject = [];
      massegeDataObject["massegeOBJ"] = massegeOBJ;
      var requestCode = 3;
      io.sockets
        .in(massegeOBJ.C_ID)
        .emit(
          "new_massege_from_server",
          socket_massege_count_counter,
          massegeOBJ,
          requestCode
        );
      // socket_massege_count[socket_massege_count_counter] = massegeDataObject;
      socket_massege_count_counter++;
    } else {
      //further improvement required
      console.log(
        "user is not currentlly active with user_id : ",
        massegeOBJ.C_ID
      );
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
    acknowledgement_count[acknowledgement_count_counter] = massegeOBJ;
    console.log(
      "massegeOBJ is, ",
      acknowledgement_count[acknowledgement_count_counter]
    );

    acknowledgement_count_counter++;

    con.query(
      "insert into `massege`(`sender_id`, `receiver_id`, `chat_id`, `massage`, `massege_sent_time`,`View_Status`) VALUES ('" +
        user_id +
        // massegeOBJ.sender_id +

        "','" +
        massegeOBJ.C_ID +
        "','" +
        massegeOBJ.Chat_id +
        "','" +
        massegeOBJ.user_massege +
        "','" +
        massegeOBJ.time_of_send +
        "','0')",
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
          if (result.affectedRows > 0) {
            console.log(
              "massege inserted succcessfully in send_massege_to_server_from_CMDV"
            );
          }
        }
      }
    );
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

  socket.on("updateUserComeToOnlineStatus", function (user_id, online_status) {
    //here we are updating our database with online status of user
    console.log(
      "updateUserComeToOnlineStatus is arive with user id : " + user_id,
      " and online status " + online_status
    );

    var d = Date.now();
    // var date = new Date(Date.now());
    var last_online_time = new Date(d);

    console.log("date is : ", d);
    console.log("date is : ", last_online_time.toString());
    // console.log("date is : ", date);
    // console.log("date is : ", date.toString());
    // console.log("date is : ", last_online_time);
    con.query(
      "update `user_info` set online_status='" +
        online_status +
        "', `last_online_time`='" +
        d +
        "' where user_id='" +
        user_id +
        "'",
      function (err, result) {
        if (err) {
          console.log("err is ", err);
        }
      }
    );
  });
  socket.on("CheckContactOnlineStatus", function (user_id, contact_id) {
    //here we are updating our database with online status of user
    // console.log("CheckContactOnlineStatus is arive from ", user_id);
    con.query(
      "select * from `user_info` where user_id='" + contact_id + "'",
      function (err, result) {
        if (err) {
          console.log("err is ", err);
        } else {
          // console.log("result is : ", result);
          if (result.length > 0) {
            var last_online_time = new Date(result[0].last_online_time);
            // console.log(
            //   "last online time is  s: ",
            //   last_online_time.toString()
            // );
            // console.log("last online time is  s: ", last_online_time.getTime());

            if (result[0].online_status_privacy == 0) {
              io.sockets
                .in(user_id)
                .emit(
                  "CheckContactOnlineStatus_return",
                  contact_id,
                  result[0].online_status,
                  last_online_time.getTime(),
                  "contact"
                );
            } else if (result[0].online_status_privacy == 1) {
              io.sockets
                .in(user_id)
                .emit(
                  "CheckContactOnlineStatus_return",
                  contact_id,
                  last_online_time.toString(),
                  "private"
                );
            } else {
              console.log("enter in else cond.  +");
            }
            // console.log(
            //   "CheckContactOnlineStatus_return is sent to ",
            //   user_id,
            //   " wih staus : ",
            //   result[0].online_status
            // );
          }
        }
      }
    );
  });

  socket.on("updateUserAboutInfo", function (user_id, about_info) {
    con.query(
      "update `user_info` set `about`='" +
        about_info +
        "' where `user_id`='" +
        user_id +
        "'",
      function (err, result) {
        if (err) {
          console.log("err is ", err);
        } else {
          io.sockets.in(user_id).emit("updateUserAboutInfo_return", 1);
        }
      }
    );
  });

  socket.on("updateUserDisplayName", function (user_id, display_name) {
    con.query(
      "update `user_info` set `display_name`='" +
        display_name +
        "' where `user_id`='" +
        user_id +
        "'",
      function (err, result) {
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
    function (user_id, contact_id) {
      con.query(
        "select * from `user_info` where user_id='" + contact_id + "'",
        function (err, result) {
          if (err) {
            console.log("err is ", err);
          } else {
            if (result.length > 0) {
              console.log(
                "getContactDetailsForContactDetailsFromMassegeViewPage : user_id:contact_id:",
                user_id,
                ":",
                contact_id
              );

              io.sockets
                .in(user_id)
                .emit(
                  "getContactDetailsForContactDetailsFromMassegeViewPage_return",
                  contact_id,
                  result[0].display_name,
                  result[0].about
                );
            }
          }
        }
      );
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
