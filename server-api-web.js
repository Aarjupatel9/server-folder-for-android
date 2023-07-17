const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ObjectId, Db } = require("mongodb");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));
app.use(cors());
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const fs = require("fs");
const https = require("https");

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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

console.log("url is : ", process.env.MONGO_UR);

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

app.get("/test", urlencodedparser, async (req, res) => {
  try {
    const result = await loginModel.findOne({
      _id: ObjectId("64605c936952931335caeb15"),
    });
    console.log("result is : ", result);

    res.send({ result: result });
  } catch (e) {
    console.log("error inside test");
  }
});

//for massenger-web
app.post("/loginForWeb", urlencodedparser, async (req, res) => {
  console.log("loginForWeb || start-b", req.body.credential);
  const credential = req.body.credential;

  if (credential.web) {
    const result = await loginModel.findOne({ Number: credential.number });

    console.log("jwt secret is : ", process.env.JWT_SECRET);
    console.log("jwt secret is : ", result._id);
    if (result) {
      if (result.Password == encrypt(credential.password)) {
        const token = jwt.sign({ _id: result._id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE,
        });
        res.cookie("id", result._id, {
          maxAge: "60 * 60",
          httpOnly: true,
          sameSite: "none",
          secure: "true",
        });
        res.cookie("token", token, {
          expires: new Date(Date.now() + process.env.JWT_SECRET_EXPIRE),
          maxAge: "60*60",
          httpOnly: true,
          sameSite: "none",
          secure: "true",
        });

        res.send({ status: 1, result: result, token: token });
      } else {
        res.send({ status: 2 });
      }
    } else {
      res.send({ status: 3 });
    }
  } else {
    res.send({ status: 5 });
  }
});
