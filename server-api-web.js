const express = require("express");
const cors = require("cors");
const app = express();
const { ObjectId } = require("mongodb");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     credentials: true,
//   })
// );

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const fs = require("fs");
const https = require("https");

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authenticateToken = require("./module/authenticateToken")


mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((responce) => {
    console.log("Connected to MongoDB , ", responce.connection.name);
  })
  .catch((err) => console.log("err in database connection"));

const loginModel = require("./mongodbModels/loginInfo");
const userModel = require("./mongodbModels/userInfo");
const massegesModel = require("./mongodbModels/masseges");


var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

const validApiKeys = [];
validApiKeys.push(process.env.API_SERVER_API_KEY);

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["api_key"];
  if (validApiKeys.includes(apiKey)) {
    console.log("validateApiKey || apiKey allowed : ", apiKey);
    next();
  } else {
    console.log("validateApiKey || apiKey denied : ", apiKey);
    res.status(401).json({ error: "Unauthorized" });
  }
};



const port_api = process.env.WEB_API_PORT;
app.listen(port_api, function () {
  console.log("Server-api listening at port %d", port_api);
});

setInterval(async function () {
  console.log("mongodb reset");
  const result = await loginModel.findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result in mongodb connection reset :", result);
}, 900000);

async function funServerStartUpHandler() {
  const result = await loginModel.findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result is : ", result);
}

app.get("/", urlencodedparser, async (req, res) => {

  res.send({ status: 1 });

});

//for massenger-web
app.post("/getContactsList", authenticateToken, urlencodedparser, async (req, res) => {
  console.log("getContactsList || start-b", req.body.id);
  const id = req.body.id;

  const result = await userModel.find({ _id: ObjectId(id) }, { Contacts: 1 });

  if (result.length > 0) {
    res.send({ status: 1, contacts: result[0].Contacts });
  } else {
    res.send({ status: 0 });
  }

});
app.post("/loginForWeb", urlencodedparser, async (req, res) => {
  console.log("loginForWeb || start-b", req.body.credential);
  const credential = req.body.credential;

  if (credential.web) {
    const result = await loginModel.findOne({ Number: credential.number });

    // console.log("jwt secret is : ", process.env.JWT_SECRET, " , ", process.env.JWT_EXPIRES_IN, " , ", process.env.JWT_COOKIE_EXPIRES);
    // console.log("jwt secret is : ", result._id);
    if (result) {
      if (result.Password == encrypt(credential.password)) {
        var _id = result._id;
        const token = jwt.sign({ _id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        // console.log("The token is: " + token);
        const cookieOptions = {
          expires: new Date(
            Date.now() +
            process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
          ),
          httpOnly: true,
          sameSite: "none",
          secure: true,
        };
        res.cookie("jwt", token, cookieOptions);
        res.send({ status: 1, data: result, token: token });
      } else {
        res.send({ status: 2 });
      }
    } else {
      res.send({ status: 0 });
    }
  } else {
    res.send({ status: 5 });
  }
});
