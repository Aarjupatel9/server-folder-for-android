const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const app = express();
// const  UploadByteArrayToS3  = require("./module/UploadByteArrayToS3");
var bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: "10000kb", extended: true }));

const { getContactsList, getContactsMasseges } = require("./controllers/contactController");
const { loginForWeb } = require("./controllers/authController");
const { profile_displayName, profile_aboutInfo, profile_profileImage } = require("./controllers/userController");
const { validateApiKey } = require("./middleWares/validateApiKey")
// const {validateApiKey} = require('./middlewares/validateApiKey');

const morgan = require("morgan");
app.use(morgan("dev"));


var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/logFiles/startaw_debug.log', { flags: 'w' });
var log_error_file = fs.createWriteStream(__dirname + '/logFiles/startaw_error.log', { flags: 'w' });
var log_stdout = process.stdout;
var log_stderr = process.stderr;

// console.log = function (d) { //
//   log_file.write(util.format(d) + '\n');
//   log_stdout.write(d + '\n');
// };
// console.error = function (d) { //
//   log_error_file.write(util.format(d) + '\n');
//   log_stderr.write(d + '\n');
// };


app.use(async (req, res, next) => {
  const allowedOrigins = [
    'https://localhost:3000',
    'http://localhost:3000',
    'https://3.109.184.63',
    'http://3.109.184.63',
    'https://35.154.246.182',
    "http://35.154.246.182"
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    console.log("origin is set to  : ", origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(
  cors({
    origin: ['https://localhost:3000',
      'http://localhost:3000',
      'https://3.109.184.63',
      'http://3.109.184.63',
      'https://35.154.246.182',
      "http://35.154.246.182"],
    credentials: true,
  })
);




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


var urlEncodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "10000kb" }));


const port_api = process.env.WEB_API_PORT;
app.listen(port_api, function () {
  console.log("Server-api listening at port %d", port_api);
});

setInterval(async function () {
  console.log("mongodb reset");
  const result = await loginModel.findById("64605c936952931335caeb15");
  console.log("result in mongodb connection reset :", result);
}, 900000);


app.get("/", urlEncodedParser, async (req, res) => {
  res.send({ status: 1 });
});

//for massenger-web
app.post("/getContactsList", urlEncodedParser, getContactsList);//, validateApiKey()

app.post("/getContactsMasseges", urlEncodedParser, getContactsMasseges);

app.post("/loginForWeb", urlEncodedParser, loginForWeb);

app.post("/profile/displayName", urlEncodedParser, profile_displayName);

app.post("/profile/aboutInfo", urlEncodedParser, profile_aboutInfo);

app.post("/profile/profileImage", urlEncodedParser, profile_profileImage);

