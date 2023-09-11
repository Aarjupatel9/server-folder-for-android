const express = require("express");
const cors = require("cors");
const app = express();
const { ObjectId } = require("mongodb");
// const  UploadByteArrayToS3  = require("./module/UploadByteArrayToS3");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "10000kb", extended: true }));

const morgan = require("morgan");
app.use(morgan("dev"));

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://localhost:3000',
    'http://localhost:3000',
    'https://3.109.184.63',
    'https://35.154.246.182'
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
    origin: ["https://localhost:3000","http://localhost:3000", "https://3.109.184.63", "https://35.154.246.182"],
    credentials: true,
  })
);

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


var urlEncodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "10000kb" }));

const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
});
const MassengersProfileImageS3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRETE_ACCESS_KEY,
  }
});
function uploadByteArrayToS3(bucketName, imageName, byteArray) {
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: byteArray,
    ACL: 'public-read', // Set this to 'private' if you want restricted access
    ContentType: 'image/jpeg', // Change the content type based on your image type
  };

  return new Promise((resolve, reject) => {
    MassengersProfileImageS3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading image:', err);
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

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

app.get("/", urlEncodedParser, async (req, res) => {

  res.send({ status: 1 });

});

//for massenger-web
app.post("/getContactsList", urlEncodedParser, async (req, res) => {//authenticateToken,
  try {
    console.log("getContactsList || start-b", req.body.id);
    const id = req.body.id;

    const result = await userModel.findOne({ _id: ObjectId(id) }, { Contacts: 1 });

    var contacts = result.Contacts;

    for (var i = 0; i < contacts.length; i++) {
      const resultx = await userModel.findOne({ _id: contacts[i]._id }, { ProfileImageVersion: 1 });
      // console.log("resultx : ", resultx);
      contacts[i].profileImageVersion = resultx.ProfileImageVersion;
    }

    // console.log("contaccts : ", contacts);


    res.send({ status: 1, contacts: contacts });
  } catch (e) {
    res.send({ status: 0 });
  }

});
app.post("/getContactsMasseges", urlEncodedParser, async (req, res) => {//authenticateToken,
  const id = req.body.id;
  const contacts = req.body.contacts;

  if (!contacts || contacts == null) {
    res.send({ status: 0 });
  }

  console.log("/getContactsMasseges || start-b", id, " , contacts l : ", contacts.length);

  var contactsMasseges = {};
  for (const contact of contacts) {
    const result = await massegesModel.findOne({
      $or: [
        {
          user1: id,
          user2: contact._id,
        },
        {
          user1: contact._id,
          user2: id,
        },
      ],
    }, { massegeHolder: 1 });
    if (result) {
      contactsMasseges[contact._id] = result.massegeHolder;
      // console.log("/getContactsMasseges || contactsMasseges of contact : ", contact._id, " , l : ", result.massegeHolder.length);
    } else {
      // console.log("/getContactsMasseges || contactsMasseges can not be found for contact : ", contact._id);
    }
  }

  // console.log("/getContactsMasseges || contactsMasseges : ", contactsMasseges);
  // console.log("/getContactsMasseges || contactsMasseges : ", contactsMasseges.length);
  res.send({ status: 1, masseges: contactsMasseges });


});
app.post("/loginForWeb", urlEncodedParser, async (req, res) => {
  console.log("loginForWeb || start-b", req.body.credential);
  const credential = req.body.credential;

  if (credential.web) {
    var result = await loginModel.findOne({ Number: credential.number });
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
        const result1 = await userModel.findOne({ _id: result._id }, { about: 1, ProfileImageVersion: 1, displayName: 1 });// ProfileImage: 1,
        console.log("loginForWeb || result : ", result);
        console.log("loginForWeb || result1 : ", result1.about);

        const data = {
          _id: result._id,
          number: result.Number,
          name: result.Name,
          AccStatus: result.AccStatus,
          tokenFCM: result.tokenFCM,
          recoveryEmail: result.RecoveryEmail,
          about: result1.about,
          displayName: result1.displayName,
          profileImageVersion: result1.ProfileImageVersion,
        }
        // console.log("loginForWeb || data : ", data);
        res.cookie("jwt", token, cookieOptions);
        console.log()
        res.send({ status: 1, data: data, token: token });
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

app.post("/profile/displayName", urlEncodedParser, async (req, res) => {
  console.log("/profile/displayName || start-b", req.body.id);
  const user_id = req.body.id;
  const displayName = req.body.displayName;

  const result = await userModel.updateOne(
    {
      _id: ObjectId(user_id),
    },
    { $set: { displayName: displayName } }
  );

  console.log("updateUserdisplayName || result", result.modifiedCount);
  res.send({ status: 1 });
});
app.post("/profile/aboutInfo", urlEncodedParser, async (req, res) => {
  console.log("/profile/displayName || start-b", req.body.id);
  const user_id = req.body.id;
  const about = req.body.about;

  const result = await userModel.updateOne(
    {
      _id: ObjectId(user_id),
    },
    { $set: { about: about } }
  );

  console.log("updateUserAboutInfo || result", result.modifiedCount);
  res.send({ status: 1 });
});

app.post("/profile/profileImage", urlEncodedParser, async (req, res) => {
  const user_id = req.body.id;
  // const imageData = req.body.byteArray;

  const rowImageData = req.body.byteArray;
  const byteArray = Object.values(rowImageData);
  const imageData = Buffer.from(byteArray);

  // console.log("/profile/profileImage || rowImageData : ", imageData);

  const result = await userModel.updateOne(
    {
      _id: ObjectId(user_id),
    },
    {
      $set: { ProfileImage: imageData },
      $inc: { ProfileImageVersion: 1 },
    }
  );
  console.log("updateUserProfileImage || result", result.modifiedCount);
  res.send({ status: result.modifiedCount });

  const bucketName = process.env.AWS_PROFILE_IMAGE_BUCKET_NAME;
  const imageName = user_id + ".jpg"; // Change this to your desired image name
  const imageLink = await uploadByteArrayToS3(bucketName, imageName, imageData);
  console.log('Image uploaded to S3. Public URL:', imageLink);
});

