const express = require("express");
const con = require("./mysqlconn");
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
const port = 10000;
const main_url = "";
const socket_url = "192.168.43.48:3110";

//socket part

var http = require("http").Server(app);
var io = require("socket.io")(http);

// http.listen(port, "192.168.43.48", function () {
//   console.log("Server listening at port %d", port);
// });
http.listen(port, main_url, function () {
  console.log("Server listening at port %d", port);
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
      console.log("user conection is : ", user_connection);
setInterval(function () {
  for (var i = 0; i < user_connection.length; i++) {
    if (
      user_connection[i][1] != 0 &&
      user_connection[i][1] + 3000 < Date.now()
    ) {
      user_connection[i] = user_connection_tmp1_fix;
      user_connection_fast[i] = 0;
      console.log("user conection is : ", user_connection);
    }
  }
}, 2000);

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
        console.log("row in result is ", result.length);

        var requestCode = 1;
        io.sockets
          .in(user_id)
          .emit(
            "new_massege_from_server",
            socket_massege_count_counter,
            result,
            requestCode
          );
        socket_massege_count[socket_massege_count_counter] = result;
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
        console.log("user_app_connected_status msg arrive ", data);
        user_connection[i][1] == Date.now();
        console.log("user conection main object ", user_connection);
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

  socket.on("new_massege_from_server_acknowledgement", function (data) {
    var return_massege_number = data.acknowledgement_id;
    console.log("new_massege_from_server_acknowledgement data : ", data);

    var updatable_data =
      socket_massege_count[return_massege_number]["massegeOBJ"];
    socket_massege_count[return_massege_number] = 0;
    console.log("updateable data is  : " + updatable_data);

    //update query
    con.query(
      "update `massege` set `View_Status`='1', `localDatabase_Status`='1' where `sender_id`='" +
        updatable_data.sender_id +
        "' AND `receiver_id`='" +
        updatable_data.C_ID +
        "' AND `massage`='" +
        updatable_data.user_massege +
        "' AND `View_Status`='0'",
      function (err, result) {
        if (err) {
          console.log(
            "err accured while update massege parameters and values \n",
            err
          );
        }
      }
    );

    // console.log(
    //   "CMDV_acknowledgement data : ",
    //   socket_massege_count[return_massege_number]
    // );
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

  socket.on("send_massege_to_server_from_CMDV", function (data, user_id) {
    console.log("data is : ", data);

    //if user's room is available then send masege to them
    if (user_connection_fast.includes(data.C_ID)) {
      console.log("contact is connected and online");
      var massegeDataObject = [];
      massegeDataObject["massegeOBJ"] = data;
      var requestCode = 3;
      io.sockets
        .in(data.C_ID)
        .emit(
          "new_massege_from_server",
          socket_massege_count_counter,
          data,
          requestCode
        );
      socket_massege_count[socket_massege_count_counter] = massegeDataObject;
      socket_massege_count_counter++;
    } else {
      //further improvement required
      console.log("user is not currentlly active with user_id : ", data.C_ID);
    }

    io.sockets
      .in(user_id)
      .emit(
        "send_massege_to_server_from_CMDV_acknowledgement",
        socket_massege_count_counter,
        data
      );
    data["requestCode"] = 6;
    acknowledgement_count[acknowledgement_count_counter] = data;
    console.log(
      "data is, ",
      acknowledgement_count[acknowledgement_count_counter]
    );

    acknowledgement_count_counter++;

    con.query(
      "insert into `massege`(`sender_id`, `receiver_id`, `chat_id`, `massage`, `massege_sent_time`,`View_Status`) VALUES ('" +
        user_id +
        // data.sender_id +

        "','" +
        data.C_ID +
        "','" +
        data.Chat_id +
        "','" +
        data.user_massege +
        "','" +
        data.time_of_send +
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

app.post("/RegisterNewUser", urlencodedparser, (req, res) => {
  console.log("enter in RegisterNewUser");

  console.log("in RegisterNewUser - number is", req.body.number);
  console.log("in RegisterNewUser - number is", req.body.name);
  console.log("in RegisterNewUser - number is", req.body.password);
  //  res.send({ status: "2" });
  con.query(
    "INSERT INTO `login_info`(`user_number`, `userPassword`, `name`, `Account_status`) VALUES ('" +
      req.body.number +
      "','" +
      req.body.password +
      "','" +
      req.body.name +
      "','0')",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result.affectedRows > 0) {
          console.log("in RegisterNewUser - user register successfully");
          res.send({ status: "1" });

          //now we have to add row into user_info table
          //first we are selceting user_id
          con.query(
            "select `user_id` from `login_info` where `user_number`='" +
              req.body.number +
              "' and `userPassword`='" +
              req.body.password +
              "' and  `name`='" +
              req.body.name +
              "' order by `user_id` DESC limit 1",
            function (err, result) {
              if (err) {
                console.log("err is ", err);
              } else {
                console.log("user_id is ", result[0].user_id);
                con.query(
                  "INSERT INTO `user_info`(`user_id`, `online_status`) VALUES ('" +
                    result[0].user_id +
                    "' , '0')",
                  function (err, result) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log(
                        "in RegisterNewUser - user register successfully ,affectedRows " +
                          result.affectedRows
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          console.log("in RegisterNewUser - result is : ", result);
          // now we have to register this member in our app
          res.send({ status: "2" });
        }
      }
    }
  );
});
app.post("/checkHaveToRegister", urlencodedparser, (req, res) => {
  console.log("number is", req.body.number);
  con.query(
    "select * from `login_info` Where `user_number`='" + req.body.number + "'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("result in /checkhave to register  ", result);
        if (result.length > 0) {
          if (result[0].userPassword == req.body.password) {
            var User_Id = result[0].user_id;
            res.send({ status: "1", user_id: User_Id });
          } else {
            res.send({ status: "0" });
          }
        } else {
          // now we have to register this member in our app
          res.send({ status: "2" });
        }
      }
    }
  );
});

app.post("/syncContactOfUser", urlencodedparser, (req, res) => {
  console.log("number is", req.body.ContactDetails);

  var ContactDetails = req.body.ContactDetails;
  var array_contactDetails = JSON.parse(ContactDetails);
  var Pure_contact_details = [];
  var response = [];

  function checkNumber(str) {
    // if (number.includes("(") || number.includes(")")) {

    // }
    number = str.replace("(", "");
    number = number.replace(")", "");
    // console.log('number is  :', number);

    let isnum = /^\d+$/.test(number);
    if (isnum) {
      return true;
    }
  }

  var counter = 0;
  console.log("array lenght is : ", array_contactDetails.length);

  for (let i = 0; i < array_contactDetails.length; i++) {
    if (array_contactDetails[i].number[0] == "+") {
      // console.log('enter in slice');
      array_contactDetails[i].number = array_contactDetails[i].number.slice(3);
    }
    array_contactDetails[i].number = array_contactDetails[i].number.replace(
      "(",
      ""
    );
    array_contactDetails[i].number = array_contactDetails[i].number.replace(
      ")",
      ""
    );
    if (checkNumber(array_contactDetails[i].number)) {
      var Allowed = true;
      for (let j = 0; j < Pure_contact_details.length; j++) {
        // console.log("enter here");
        if (array_contactDetails[i].number === Pure_contact_details[j].number) {
          // console.log("enter in false aalowed");
          Allowed = false;
        }
      }
      if (Allowed) {
        // console.log("entr in allowed");
        // console.log("part is ", array_contactDetails[i][0]);
        Pure_contact_details[counter] = array_contactDetails[i];
        counter++;
      }
    }
  }
  console.log("after Prossec number is", Pure_contact_details.length);

  con.query("select * from `login_info`", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      var responseCounter = 0;
      var isOnSpecifyarray = [];
      console.log("result sunc contact is:  ", result.length);
      for (let i = 0; i < Pure_contact_details.length; i++) {
        for (let j = 0; j < result.length; j++) {
          if (result[j].user_number == Pure_contact_details[i].number) {
            console.log(
              "yes for : ",
              i,
              "  is :",
              Pure_contact_details[i].number
            );
            Pure_contact_details[i]["C_ID"] = result[j].user_id;
            console.log("after et C_ID : ", result[j].user_id);
            console.log("after et C_ID : ", Pure_contact_details[i]);

            response[responseCounter] = Pure_contact_details[i];
            responseCounter++;
            isOnSpecifyarray[responseCounter] = 1;
          }
        }
      }
      var isOnnumber = responseCounter;
      for (let i = 0; i < Pure_contact_details.length; i++) {
        if (isOnSpecifyarray[i] != 1) {
          response[responseCounter] = Pure_contact_details[i];
          responseCounter++;
        }
      }

      console.log("isonnumber is  : ", Pure_contact_details.length);
      // console.log("isonnumber is  : ", array_contactDetails.length);
      console.log("isonnumber is  : ", isOnnumber);

      // console.log('responce object is : ', response);
      console.log("counter is my choise");

      var ja = JSON.stringify(response);
      res.send({ ja: ja, isOnnumber: isOnnumber });
    }
  });

  // response = [
  //   {
  //     isOnMassengerID: "aarju",
  //   },
  // ];
});

function rawBody(req, res, next) {
  var chunks = [];

  req.on("data", function (chunk) {
    chunks.push(chunk);
  });

  req.on("end", function () {
    var buffer = Buffer.concat(chunks);

    req.bodyLength = buffer.length;
    req.rawBody = buffer;
    next();
  });

  req.on("error", function (err) {
    console.log(err);
    res.status(500);
  });
}

app.post("/post_user_profile_image_to_server", rawBody, function (req, res) {
  if (req.rawBody && req.bodyLength > 0) {
    console.log("image is aarrived");

    res.send(200, { status: "OK" });
  } else {
    res.send(500);
  }
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

//user_profile uploading
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

var upload = multer({ storage: storage });

app.post(
  "/uploadUserProfilePhoto",
  upload.single("myFile"),
  (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      console.log("error", "Please upload a file");

      res.send({ code: 500, msg: "Please upload a file" });
      return next({ code: 500, msg: error });
    }
    setTimeout(() => {
      res.send({ code: 200, msg: file });
    }, 1000);
  }
);
//Uploading multiple files
app.post("/uploadmultiple", upload.array("myFiles", 12), (req, res, next) => {
  const files = req.files;
  if (!files) {
    const error = new Error("Please choose files");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(files);
});
