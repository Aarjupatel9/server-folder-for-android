var express = require("express"); // call express
const { stringify } = require("querystring");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.send("Welcome to my socket");
});

var user_connection = [];
var user_connection_counter = 0;

io.on("connection", function (socket) {
  console.log("one user connected : " + socket.id);
  console.log("token is : ", socket.handshake.auth);

  socket.on("join", function (user_id) {
    socket.join(user_id); // We are using room of socket io

    console.log("user_id is :", user_id);
    user_connection[user_connection_counter] = user_id;
    user_connection_counter++;

    //send massege afrter 5 sec for trial
    setTimeout(() => {
      console.log("send massege to : ", user_connection[0]);
      io.sockets.in(user_connection[0]).emit("new_msg", { msg: "hello" });
      console.log("massege is sent");
    }, 3000);
  });

  socket.on("send_new_massege", function (data) {
    var user_login_id = data.user_login_id;

    console.log('data is : ', data);
    
    console.log("C_ID is", data.C_ID);
    console.log("user_login_id is", user_login_id);
    console.log("massege is", data.massege);

    // con.query(
    //   "insert into `massege`(`sender_id`, `receiver_id`, `massage`, `View_Status`) VALUES ('" +
    //     user_login_id +
    //     "','" +
    //     data.C_ID +
    //     "','" +
    //     data.massege +
    //     "','0')",
    //   function (err, result) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       if (result.affectedRows > 0) {
    //         // res.send({ status: "1" });
    //       }
    //     }
    //   }
    // );
  });


  // console.log("this is message :", data);
});

var port = process.env.PORT || 3110;
http.listen(port, "192.168.43.48", function () {
  console.log("Server listening at port %d", port);
});
