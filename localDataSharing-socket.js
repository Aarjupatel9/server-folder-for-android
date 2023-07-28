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


var http = require("http").Server(app);
var io = require("socket.io")(http);

const port = process.env.LOCAL_DATA_SHARING_SOCKET_PORT;
function serverStart() {
    http.listen(port, function () {
        console.log("Server-socket listening at port %d", port);
    });
}
serverStart();



io.on("connection", function (socket) {

    console.log("Client connected:", socket.id);
    socket.on("connect", (socket) => {
        console.log("connected , ", socket.socket_id);
    })

    socket.on("addClientInfo", (token, socket_id) => {
        console.log("on common server addClientInfo token  : ", token, " , ", socket_id);
        io.emit("addClientInfo", token, socket_id);
    });

    socket.on("removeClientInfo", (token) => {
        console.log("removeClientInfo || for : ", token);
        io.emit("removeClientInfo", token);
    });
    socket.on("sendEmitEvent", (eventName, sendeTo, socjetObj, ...data) => {
        console.log("sendEmitEvent || for : ", eventName);
        io.emit("sendEmitEvent", eventName, sendeTo, socjetObj, ...data);
    });

    socket.on("getClientinfo", (updatedClientInfo) => {
        //need to work
    });
});

app.get("/", (req, res) => {
    res.send({ Status: 1 });
})