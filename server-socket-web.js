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


//socket part
var http = require("http").Server(app);
var io = socketLib(http, {
  cors: {
    origin: "https://localhost:3000",
    allowedHeaders: ["token"],
    credentials: true
  }
});

const server_id = 1;

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
    console.log("key is : ", key);
    if (clientInfo[key] == socket_id) {
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
  console.log("Server-Client connected to the socket server");
});

socket_local_client_instacnce.on("disconnect", () => {
  console.log("Server-Client disconnected from the socket server");
});


socket_local_client_instacnce.on("addClientInfo", (token, socket_id) => {
  console.log("Server-Client || on addClientInfo : ", token, " , ", socket_id);
  clientInfo[token] = socket_id;
});
socket_local_client_instacnce.on("removeClientInfo", (socket_id) => {
  console.log("Server-Client || on removeClientInfo socket_id :  ", socket_id);
  var r = removeClientFromClientInfo(socket_id);
  console.log("result : ", r);
});

//socket experiment
app.get("/check", (req, res) => {
  console.log("/check || clientInfo : ", clientInfo);
  res.send({ clientInfo });
});

app.get("/addClientInfo", (req, res) => {
  const token = "token1";
  const socket_id = "id1";
  socket_local_client_instacnce.emit("addClientInfo", token, socket_id);
  res.send({ status: 1 });
});
app.get("/removeClientInfo", (req, res) => {
  const socket_id = "id1";
  socket_local_client_instacnce.emit("removeClientInfo", socket_id);
  res.send({ status: 1 });
});


io.on("connection", (socket) => {
  socketClientInit(socket);
});



function socketClientInit(socket) {
  console.log("socketClientInit connect EVENT || socket.id : ", socket.id);

  var combine = socket.handshake.auth.token;
  var apiKey = combine.slice(0, 64);
  var token = combine.slice(64);
  var socket_id = socket.id;
  // checkNewMassege(token, socket);
  // funUpdateUserOnlineStatus(token, 1);
  if (isClientConnected(token)) {
    console.log(
      "socketClientInit value is already inserted into clientInfo object"
    );
  } else {
    socket_local_client_instacnce.emit("addClientInfo", token, socket_id, SERVER_ID);
    console.log(
      "socketClientInit || inserting into clientInfo object, socket.id : ",
      socket_id
    );
    // connectWithBrodcastRooms(socket, token);
  }
}