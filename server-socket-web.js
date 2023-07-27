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

const port = process.env.WEB_SOCKET_PORT;

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");


//socket part
var http = require("http").Server(app);
var io = require("socket.io")(http);

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

//local data sharing
const socket_client = require("socket.io-client");
const socket_local_client_instacnce = socket_client("http://localhost:10010");

socket_local_client_instacnce.on("connect", () => {
  console.log("Client connected to the socket server");
});

socket_local_client_instacnce.on("disconnect", () => {
  console.log("Client disconnected from the socket server");
});


socket_local_client_instacnce.on("addClientInfo", (token, socket_id) => {
  console.log("on addClientInfo : ");
  clientInfo[token] = socket_id;
});
socket_local_client_instacnce.on("removeClientInfo", (token) => {
  for (const key in clientInfo) {
    if (clientInfo[key] == token) {
      delete clientInfo[key];
    }
  }
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
  const token = "token1";
  socket_local_client_instacnce.emit("removeClientInfo", token);
  res.send({ status: 1 });
});

