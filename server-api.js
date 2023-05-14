const express = require("express");
const app = express();

// var con = require("./mysqlconn");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");

const { Console } = require("console");
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

const { MongoClient, ObjectId, Db } = require("mongodb");

// var https_options = {
//   key: fs.readFileSync("./system.key"),
//   cert: fs.readFileSync("./system.crt"),
//   ca: [fs.readFileSync("./system.crt"), fs.readFileSync("./system.crt")],
// };

// const app = express(https_options);

const multer = require("multer");
var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");

var url = process.env.MONGODB_URL;
var mainDb;
var DbO;

console.log("url = ", process.env.MONGODB_URL);

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  mainDb = db;
  DbO = mainDb.db("massenger");
  console.log("after initialize DbO");
  funServerStartUpHandler();
});

const port_api = process.env.API_PORT;
app.listen(port_api, function () {
  console.log("Server-api listening at port %d", port_api);
});

setInterval(async function () {
  console.log("mongodb reset");
  const result = await DbO.collection("login_info").findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result in mongodb connection reset :", result);
}, 900000);

async function funServerStartUpHandler() {
  const result = await DbO.collection("login_info").findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result is : ", result);
}

app.get("/test", urlencodedparser, async (req, res) => {
  const result = await DbO.collection("login_info").findOne({
    _id: ObjectId("64605c936952931335caeb15"),
  });
  console.log("result is : ", result);
  res.send({ result: result });
});

app.post("/RegisterNewUser", urlencodedparser, async (req, res) => {
  console.log("enter in RegisterNewUser");

  var number = decrypt(req.body.number);
  var name = decrypt(req.body.name);
  var password = req.body.password;

  console.log("in RegisterNewUser - number is", number);
  console.log("in RegisterNewUser - number is", name);
  console.log("in RegisterNewUser - number is", password);

  const result = await DbO.collection("login_info").findOne({
    Number: number,
  });
  console.log("result is : ", result);

  if (result == null) {
    const userObj = {
      Number: number,
      Password: password,
      Name: name,
      AccStatus: 0,
    };

    const result = await DbO.collection("login_info").insertOne(userObj);
    if (result) {
      console.log("Register result is : ", result);
      const result1 = await DbO.collection("user_info").insertOne({
        _id: ObjectId(result.insertedId),
        about: "hey there, i am using massenger!",
        Contacts: [],
      });
      const result2 = await DbO.collection("masseges").insertOne({
        _id: ObjectId(result.insertedId),
        Contacts: [],
      });
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
});

app.post("/checkHaveToRegister", urlencodedparser, async (req, res) => {
  var number = decrypt(req.body.number);
  console.log("number is", req.body.number);

  const result = await DbO.collection("login_info").findOne({
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
      res.send({ status: "1", user_id: result._id });
    } else {
      res.send({ status: "0" });
    }
  } else {
    // now we have to register this member in our app
    res.send({ status: "2" });
  }
});

app.post("/syncContactOfUser", urlencodedparser, async (req, res) => {
  console.log("user id is", req.body[0]);
  console.log("contact details before decryption: ", req.body[1]);
  console.log("file name is  ./numbers/" + req.body[0] + ".txt ");

  fs.writeFile(
    "./numbers/" + req.body[0] + ".txt",
    JSON.stringify(req.body[1]),
    function (err) {
      if (err) {
        console.log("There has been an error saving your configuration data.");
        console.log(err.message);
        return;
      }
      console.log("Configuration saved successfully.");
    }
  );

  var array_contactDetails = req.body[1];

  // function this_decrypt() {
  //   for (let i = 0; i < array_contactDetails.length; i++) {
  //     array_contactDetails[i][2] = decrypt(array_contactDetails[i][2]);
  //     // array_contactDetails[i][0] = decrypt(array_contactDetails[i][0]);
  //     // array_contactDetails[i][1] = decrypt(array_contactDetails[i][1]);
  //   }
  // }

  // this_decrypt();
  // console.log("contact details after decryption: ", array_contactDetails);

  var Pure_contact_details = [];
  var response = [];

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
  console.log("after Prossec number is", Pure_contact_details.length);
  console.log("after Prossec numberArray length is", NumbersArray.length);

  const result = await DbO.collection("login_info").find({
    Number: { $in: NumbersArray },
  });

  var returnArray = [];
  var returnCounter = 0;

  while (await result.hasNext()) {
    const document = await result.next();
    console.log("result is : ", document);
    console.log("result is : ", document._id);

    var tmp = {
      _id: document._id,
      Number: document.Number,
      Name: document.Name,
    };
    returnArray[returnCounter] = tmp;
    // console.log(document);
  }
  console.log("result array is : ", returnArray.toString());

  res.send(returnArray);

  // con.query("select * from `login_info`", function (err, result) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     var responseCounter = 0;
  //     // var isOnSpecifyarray = [];
  //     console.log("result sunc contact is:  ", result.length);
  //     for (let i = 0; i < Pure_contact_details.length; i++) {
  //       for (let j = 0; j < result.length; j++) {
  //         if (result[j].user_number == Pure_contact_details[i][2]) {
  //           console.log("yes for : ", i, "  is :", Pure_contact_details[i][2]);
  //           Pure_contact_details[i][0] = result[j].user_id.toString();
  //           console.log("after add C_ID : ", Pure_contact_details[i]);
  //           Pure_contact_details[i][0] = encrypt(Pure_contact_details[i][0]);
  //           Pure_contact_details[i][2] = encrypt(Pure_contact_details[i][2]);

  //           console.log("after et enc : ", Pure_contact_details[i]);

  //           response[responseCounter] = Pure_contact_details[i];
  //           responseCounter++;
  //           // isOnSpecifyarray[responseCounter] = 1;
  //         }
  //       }
  //     }
  //     var isOnnumber = responseCounter;
  //     // for (let i = 0; i < Pure_contact_details.length; i++) {
  //     //   if (isOnSpecifyarray[i] == 1) {
  //     //   } else {
  //     //     // Pure_contact_details[i][2] = encrypt(Pure_contact_details[i][2]);
  //     //     response[responseCounter] = Pure_contact_details[i];
  //     //     responseCounter++;
  //     //   }
  //     // }

  //     console.log("isonnumber is  : ", Pure_contact_details.length);
  //     console.log("isonnumber is  : ", isOnnumber);

  //     console.log("response: " + response);

  //     res.send(response);
  //   }
  // });
});
// end of sync contact

app.post("/SaveFireBaseTokenToServer", urlencodedparser, (req, res) => {
  var user_id = decrypt(req.body.user_login_id);
  var token = decrypt(req.body.tokenFCM);
  console.log(
    "SaveFireBaseTokenToServer : user_id is",
    user_id,
    " token: ",
    token
  );

  DbO.collection("login_info").updateOne(
    {
      _id: ObjectId(user_id),
    },
    { $set: { tokenFCM: token } },
    (err, result) => {
      if (err) throw err;
      console.log("result in /SaveFireBaseTokenToServer to register  ", result);
      if (result.modifiedCount > 0) {
        res.send({ status: "1" });
      } else {
        res.send({ status: "2" }); // 2 send when updattion in failed
      }
    }
  );
});
app.post(
  "/GetContactDetailsOfUserToSaveLocally",
  urlencodedparser,
  (req, res) => {
    var user_id = req.body[0];
    var CID = req.body[1];
    console.log("GetContactDetailsOfUserToSaveLocally || user_id:", user_id);
    console.log("GetContactDetailsOfUserToSaveLocally || CID:", CID);

    con.query(
      "SELECT * FROM login_info INNER JOIN user_info ON login_info.user_id= user_info.user_id where login_info.user_id='" +
        CID +
        "'",
      function (err, result) {
        if (err) {
          console.log("GetContactDetailsOfUserToSaveLocally || con err:", err);
        } else {
          console.log(
            "GetContactDetailsOfUserToSaveLocally || con result",
            result
          );
          var response = [];
          response[0] = result[0].user_id;
          response[1] = result[0].user_number;
          response[2] = result[0].name;
          response[3] = result[0].last_online_timel̥l̥;
          response[4] = result[0].about;
          response[5] = result[0].display_name;
          res.send(response);
        }
      }
    );
  }
);

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
