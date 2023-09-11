const express = require("express");
const app = express();
const { MongoClient, ObjectId, Db } = require("mongodb");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const fs = require("fs");
const https = require("https");
const mongoose = require("mongoose");
const uuid = require("uuid");

const loginModel = require("./mongodbModels/loginInfo");
const userModel = require("./mongodbModels/userInfo");
const massegesModel = require("./mongodbModels/masseges");

const sendOtp = require("./module/myFunctions")


console.log("mongo url : ", process.env.MONGO_URL);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((responce) => {
    console.log("Connected to MongoDB , ", responce.connection.name);
  })
  .catch((err) => console.log(err));


var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");
const otpModel = require("./mongodbModels/otpModel");


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


const port_api = process.env.API_PORT;
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
  const result = await loginModel.findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result is : ", result);
  res.send({ result: result });
});

app.post(
  "/RegisterNewUser",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {
    console.log("enter in RegisterNewUser");

    var number = decrypt(req.body.number);
    var name = decrypt(req.body.name);
    var password = req.body.password;

    console.log("in RegisterNewUser - number is", number);
    console.log("in RegisterNewUser - number is", name);
    console.log("in RegisterNewUser - number is", password);

    const result = await loginModel.findOne({
      Number: number,
    });
    console.log("result is : ", result);

    if (result == null) {
      const loginObj = new loginModel({
        Number: number,
        Password: password,
        Name: name,
        AccStatus: 0,
      });

      const result = await loginObj.save();

      if (result) {
        const d = Date.now();
        console.log("Register result is : ", result);
        const userObj = new userModel({
          _id: ObjectId(result._id),
          about: "jay shree krushn",
          Contacts: [],
          onlineStatus: d,
          ProfileImageVersion: 0,
          displayName: name,
        });
        const result1 = await userObj.save();

        console.log("in RegisterNewUser - user register successfully");
        res.send({ status: "1" });
      } else {
        console.log("in RegisterNewUser - result is : ", result);
        // now we have to register this member in our app
        res.send({ status: "2" });
      }
    } else {
      res.send({ status: "0" });
    }
  }
);

app.post(
  "/checkHaveToRegister",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {
    var number = decrypt(req.body.number);
    console.log("number is", req.body.number);

    const result = await loginModel.findOne({
      Number: number,
    });
    console.log("result in /checkhave to register  ", result);

    if (result != null) {
      console.log(
        "/checkhave to register password = ",
        result.Password,
        " : ",
        req.body.password
      );
      if (result.Password == req.body.password) {
        const userData = await userModel.findOne({
          _id: result._id,
        });
        res.send({
          status: "1",
          user_id: result._id,
          RecoveryEmail: result.RecoveryEmail,
          displayName: userData.displayName,
          about: userData.about,
          ProfileImage: userData.ProfileImage,
          ProfileImageVersion: userData.ProfileImageVersion,
        });
      } else {
        res.send({ status: "0" });
      }
    } else {
      // now we have to register this member in our app
      res.send({ status: "2" });
    }
  }
);

app.post(
  "/updateContactNameOfUser",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {

    var userId = req.body[0];
    var array_contactDetails = req.body[1];

    for (let i = 0; i < array_contactDetails.length; i++) {

      const id = array_contactDetails[i][0];
      const mn = array_contactDetails[i][1];
      const dn = array_contactDetails[i][2];

      const updateResult = await userModel.updateOne(
        { _id: ObjectId(userId), 'Contacts.Number': mn.toString() },
        { $set: { 'Contacts.$.Name': dn } }
      );

      console.log("after update DN of ", id, dn, mn.toString(), " : ", updateResult.modifiedCount);

    }

    res.send([{ status: 1 }])

  });


app.post(
  "/syncContactOfUser",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {
    console.log("user id is", req.body[0]);
    const user_id = req.body[0];
    // console.log("contact details before decryption: ", req.body[1]);
    console.log("file name is  ./numbers/" + req.body[0] + ".txt ");

    fs.writeFile(
      "./numbers/" + user_id + ".txt",
      JSON.stringify(req.body[1]),
      function (err) {
        if (err) {
          console.log(
            "There has been an error saving your configuration data."
          );
          console.log(err.message);
          return;
        }
        console.log("Configuration saved successfully.");
      }
    );

    var array_contactDetails = req.body[1];

    var Pure_contact_details = [];
    var NumbersArray = [];

    function checkNumber(str) {
      number = str;
      // number = str.replace("(", "");
      // number = number.replace(")", "");
      // console.log('number is  :', number);
      let isnum = /^\d+$/.test(number);
      if (isnum) {
        return true;
      }
    }

    var counter = 0;
    console.log("array lenght is : ", array_contactDetails.length);

    for (let i = 0; i < array_contactDetails.length; i++) {
      if (checkNumber(array_contactDetails[i][2])) {
        var Allowed = true;
        for (let j = 0; j < Pure_contact_details.length; j++) {
          // console.log("enter here");
          if (array_contactDetails[i][2] === Pure_contact_details[j][2]) {
            // console.log("enter in false aalowed");
            Allowed = false;
          }
        }
        if (Allowed) {
          // console.log("entr in allowed");
          // console.log("part is ", array_contactDetails[i][0]);
          Pure_contact_details[counter] = array_contactDetails[i];
          NumbersArray[counter] = array_contactDetails[i][2];
          counter++;
        }
      }
    }
    // console.log("after Prossec number is", Pure_contact_details.length);
    // console.log("after Prossec numberArray length is : ", NumbersArray.length);
    // console.log("after Prossec numberArray is : ", NumbersArray.toString());

    const result = await loginModel.find({
      Number: { $in: NumbersArray },
    });

    var returnArray = [];
    try {
      result.forEach((ele) => {
        // console.log("result foreach loop, ele :", ele);  
        returnArray.push(ele);
      });
    } catch (e) {
      // console.log("result is empty while matching from database , result:");
    }

    console.log("returnArray array is : ", returnArray.length);
    res.send(returnArray);

    // update collction according to connected user into users's documents in all three collection
    returnArray.forEach(async (element) => {
      // console.log("foreach element : ", element._id);

      // for userModel
      // const updateResult = await userModel.updateOne(
      //   { _id: ObjectId(user_id) },
      //   {
      //     $addToSet: {
      //       Contacts: {
      //         _id: element._id,
      //         Number: element.Number,
      //         Name: element.Name,
      //       },
      //     },
      //   }
      // );
      const updateResult = await userModel.updateOne(
        { _id: ObjectId(user_id), Contacts: { $not: { $elemMatch: { Number: element.Number } } } },
        {
          $push: {
            Contacts: {
              _id: element._id,
              Number: element.Number,
              Name: element.Name,
            },
          },
        }
      );
      // console.log("array update result is: ", updateResult);

      //for massegeModel
      if (user_id == element._id) {
        const existingDocument = await massegesModel.find({
          user2: element._id,
          user1: element._id,
        });
        if (existingDocument.length == 0) {
          // console.log(
          //   "enter inside the insert cond. foer elemet : ",
          //   element._id,
          //   " and  user_id : ",
          //   user_id
          // );
          const massegeObj = new massegesModel({
            user1: element._id,
            user2: element._id,
          });
          const r3 = await massegeObj.save();
        } else {
          // console.log(
          //   "enter inside the else cond. for elemet : ",
          //   element._id,
          //   " and  : ",
          //   existingDocument.length,
          //   " for user_id : ",
          //   user_id
          // );
        }
      } else {
        const existingDocument = await massegesModel.find({
          $or: [
            {
              user1: user_id,
              user2: element._id,
            },
            {
              user2: user_id,
              user1: element._id,
            },
          ],
        });
        if (existingDocument.length == 0) {
          // console.log(
          //   "enter inside the insert cond. foer elemet : ",
          //   element._id,
          //   " and  user_id : ",
          //   user_id
          // );
          const massegeObj = new massegesModel({
            user1: user_id,
            user2: element._id,
          });
          const r3 = await massegeObj.save();
        } else {
          // console.log(
          //   "enter inside the else cond. for elemet : ",
          //   element._id,
          //   " and  : ",
          //   existingDocument.length,
          //   " for user_id : ",
          //   user_id
          // );
        }
      }//end for massegeModel


    });
  }
);

app.post(
  "/SaveFireBaseTokenToServer",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {
    try {
      var user_id = decrypt(req.body.user_login_id);
      var token = decrypt(req.body.tokenFCM);
      console.log(
        "SaveFireBaseTokenToServer : user_id is",
        user_id,
        " token: ",
        token
      );

      const result = await loginModel.updateOne(
        {
          _id: ObjectId(user_id),
        },
        { $set: { tokenFCM: token } }
      );
      console.log("result in /SaveFireBaseTokenToServer to register  ", result);
      if (result.matchedCount) {
        res.send({ status: "1" });
      } else {
        res.send({ status: "2" });
      }
    } catch (e) {
      res.send({ status: "2" }); // 2 send when updattion in failed
    }
  }
);
app.post(
  "/GetContactDetailsOfUserToSaveLocally",
  validateApiKey,
  urlencodedparser,
  (req, res) => {
    var user_id = req.body[0];
    var CID = req.body[1];
    console.log("GetContactDetailsOfUserToSaveLocally || user_id:", user_id);
    console.log("GetContactDetailsOfUserToSaveLocally || CID:", CID);

    loginModel.aggregate(
      [
        {
          $lookup: {
            from: "userinfos", // Name of the collection to join
            localField: "_id", // Field from the current collection (userModel)
            foreignField: "_id", // Field from the collection being joined (messageModel)
            as: "joinedData", // Name of the new field to store the joined documents
          },
        },
        {
          $project: {
            _id: 1,
            Number: 1,
            Name: 1,
            "joinedData.about": 1,
            "joinedData.ProfileImage": 1,
            "joinedData.ProfileImageVersion": 1,
            "joinedData.displayName": 1,
            "joinedData.onlineStatus": 1,
          },
        },
      ],
      (err, result) => {
        if (err) {
          console.error("Error while performing join:", err);
          return;
        }
        console.log("Joined result:", result);
        var response = [];
        response[0] = result._id;
        response[1] = result.Number;
        response[2] = result.Name;
        response[3] = result.onlineStatus;
        response[4] = result.about;
        response[5] = result.displayName;
        response[5] = result.ProfileImage;
        response[5] = result.ProfileImageVersion;
        res.send(response);
      }
    );
  }
);


//recovery email 
app.post(
  "/RecoveryEmailOtpSend",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {

    var email = req.body.email;
    var id = req.body.id;

    console.log("enter in RecoveryEmailOtpSend : email : ", email);

    const resultprev = await loginModel.find({ RecoveryEmail: email });
    if (resultprev.length == 0) {

      const result = await loginModel.findOne({
        _id: ObjectId(id),
      });
      console.log("result is : ", result);

      if (result != null) {
        const generatedOtp = generateOTP();
        var OBJ = {
          subject: "Recovery email",
          email: email,
          html: `hello, your email address is added to a massenger account , your opt for verify the Email is  <h2>  ${generatedOtp}</h2>  <br><br><br><br><hr>  if you are not aware of this action then dont worry, we will keep you secure`,
        }
        sendOtp(OBJ).then(async (resolve) => {
          const newObj = {
            emailVerification: {
              otp: generatedOtp,
              time: Date.now()
            }
          };

          console.log("otp is sent successfully : ", generatedOtp, " : ", newObj);
          const result1 = await otpModel.updateOne(
            { _id: ObjectId(id) },
            newObj,
            { upsert: true }
          );
          if (result1) {
            res.send({ status: 1 });
          } else {
            res.send({ status: 2 });
          }

        }).catch((error) => {
          console.log("error in otp mail sending : ", error);
          res.send({ status: 0 });
        })
      }
    } else {
      res.send({ status: 5 });
    }
  }
);
app.post(
  "/RecoveryEmailOtpVerify",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {

    var email = req.body.email;
    var otp = req.body.otp;
    var id = req.body.id;

    console.log("enter in RecoveryEmailOtpVerify : email : ", email, " , ", otp);

    const result = await otpModel.findOne({
      _id: ObjectId(id),
    });

    if (result != null) {
      console.log("enter in RecoveryEmailOtpVerify : result : ", result.otp, " , ", otp);
      if (result.emailVerification != null && result.emailVerification.otp == otp) {
        const result = await loginModel.updateOne({ _id: ObjectId(id) }, { RecoveryEmail: email }, { upsert: true });
        console.log("enter in RecoveryEmailOtpVerify || update result : ", result);
        if (result) {
          res.send({ status: 1, email: email });
        } else {
          res.send({ status: 2 });
        }

      } else {
        res.send({ status: 0 });
      }
    }
  }
);

function generateOTP() {
  const otpLength = 6;
  let otp = '';
  for (let i = 0; i < otpLength; i++) {
    otp += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
  }
  return otp;
}

//forgot passwprd
app.post(
  "/ForgotPasswordOtpSend",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {
    var email = req.body.email;

    console.log("enter in ForgotPasswordOtpSend : email : ", email);

    const result = await loginModel.findOne({
      RecoveryEmail: email,
    });
    console.log("result is : ", result);

    if (result != null) {

      const generatedOtp = generateOTP();
      var OBJ = {
        subject: "Recovery email",
        email: email,
        html: `hello, we got request for reset the password of your massenger account assosiate with this email, your opt for authentication is : <h2>  ${generatedOtp}</h2>  <br><br><br><br><hr>  if you are not aware of this action then dont worry, do not share otp with other and we will keep you secure... <br><br> <h3>Thank you , Team Massenger</h3>`,
      }

      sendOtp(OBJ).then(async (resolve) => {
        console.log("ForgotPasswordOtpSend || otp is sent successfully : ", generatedOtp);
        const newObj = {
          forgotPassword: {
            otp: generatedOtp,
            time: Date.now()
          }
        };

        console.log("ForgotPasswordOtpSend || _id : ", result._id);

        const result1 = await otpModel.updateOne(
          { _id: ObjectId(result._id) },
          newObj,
          { upsert: true, new: true }
        );

        if (result1) {
          res.send({ status: 1, id: result._id });
        } else {
          res.send({ status: 5 });
        }

      }).catch((error) => {
        console.log("ForgotPasswordOtpSend || error in otp mail sending : ", error);
        res.send({ status: 0 });
      })
    } else {
      res.send({ status: 2 });
    }
  }
);

function generateSlug() {
  return uuid.v4();
}

app.post(
  "/ForgotPasswordOtpVerify",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {

    var otp = req.body.otp;
    var id = req.body.id;

    console.log("enter in RecoveryEmailOtpVerify : otp : ", " , ", otp);
    const result = await otpModel.findOne({
      _id: ObjectId(id),
    });

    if (result != null) {
      console.log("enter in RecoveryEmailOtpVerify : result : ", result.forgotPassword.otp, " , ", otp);
      if (result.forgotPassword != null && result.forgotPassword.otp == otp) {
        // const result = await loginModel.updateOne({ _id: ObjectId(id) }, { RecoveryEmail: email }, { upsert: true });

        const slug = generateSlug();
        const slugTime = Date.now();

        const updateResult = await otpModel.updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              "forgotPassword.slug": slug,
              "forgotPassword.slugTime": slugTime,
            },
          },
          { upsert: true }
        );

        console.log("enter in RecoveryEmailOtpVerify || update result : ", updateResult);
        if (updateResult.modifiedCount > 0) {
          res.send({ status: 1, slug: slug });
        } else {
          res.send({ status: 2 });
        }

      } else {
        res.send({ status: 0 });
      }
    }
  }
);

app.post(
  "/ForgotPasswordChangePassword",
  validateApiKey,
  urlencodedparser,
  async (req, res) => {

    var password = req.body.password;
    var slug = req.body.slug;
    var id = req.body.id;


    console.log("enter in ForgotPasswordChangePassword : password : ", password, " , ", id);
    const result = await otpModel.findOne({
      _id: ObjectId(id),
    });

    if (result != null) {
      console.log("enter in ForgotPasswordChangePassword : result : ", result);
      if (result.forgotPassword != null && result.forgotPassword.slug == slug) {

        if (result.forgotPassword.slugTime - 600000 < Date.now()) {// after 10 minute refuce to update the password

          const updateResult = await loginModel.updateOne(
            { _id: ObjectId(id) },
            {
              $set: {
                Password: password
              },
            },
            { upsert: false }
          );

          console.log("enter in RecoveryEmailOtpVerify || update result : ", updateResult);
          if (updateResult.modifiedCount > 0) {
            res.send({ status: 1 });
          } else {
            res.send({ status: 5 });
          }

        } else {
          res.send({ status: 2 }); // refuce request duto long time taken by user
        }


      } else {
        res.send({ status: 0 });// refuce as invalid request
      }
    }
  }
);

