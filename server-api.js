const express = require("express");
var con = require("./mysqlconn");
const fs = require("fs");
const app = express();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
var bodyParser = require("body-parser");
var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "2000kb" }));
app.use(bodyParser.urlencoded({ limit: "2000kb", extended: true }));

const encrypt = require("./module/vigenere_enc.js");
const decrypt = require("./module/vigenere_dec.js");
const { Console } = require("console");

const port_api = process.env.API_PORT;
app.listen(port_api, function() {
  console.log("Server-api listening at port %d", port_api);
})

setInterval(function () {
  console.log("mysqlconnection reset");
  con = require("./mysqlconn");
}, 900000);

app.get("/test", urlencodedparser, (req, res) => {
  res.send({ name: "aarju" });
});
app.post("/RegisterNewUser", urlencodedparser, (req, res) => {
  console.log("enter in RegisterNewUser");

  var number = decrypt(req.body.number);
  var name = decrypt(req.body.name);
  var password = req.body.password;

  console.log("in RegisterNewUser - number is", number);
  console.log("in RegisterNewUser - number is", name);
  console.log("in RegisterNewUser - number is", password);

  //  res.send({ status: "2" });
  con.query(
    "INSERT INTO `login_info`(`user_number`, `userPassword`, `name`, `Account_status`) VALUES ('" +
      number +
      "','" +
      password +
      "','" +
      name +
      "','0')",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result.affectedRows > 0) {
          console.log("in RegisterNewUser - user register successfully");
          res.send({ status: "1" });

          //now we have to add row into user_info table
          //first we are selceting user_id
          con.query(
            "select `user_id` from `login_info` where `user_number`='" +
              number +
              "' and `userPassword`='" +
              password +
              "' and  `name`='" +
              name +
              "' order by `user_id` DESC limit 1",
            function (err, result) {
              if (err) {
                console.log("err is ", err);
              } else {
                console.log("user_id is ", result[0].user_id);
                con.query(
                  "INSERT INTO `user_info`(`user_id`, `online_status`) VALUES ('" +
                    result[0].user_id +
                    "' , '0')",
                  function (err, result) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log(
                        "in RegisterNewUser - user register successfully ,affectedRows " +
                          result.affectedRows
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          console.log("in RegisterNewUser - result is : ", result);
          // now we have to register this member in our app
          res.send({ status: "2" });
        }
      }
    }
  );
});

app.post("/checkHaveToRegister", urlencodedparser, (req, res) => {
  var number = decrypt(req.body.number);
  console.log("number is", req.body.number);
  con.query(
    "select * from `login_info` Where `user_number`='" + number + "'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("result in /checkhave to register  ", result);
        if (result.length > 0) {
          if (result[0].userPassword == req.body.password) {
            var User_Id = result[0].user_id;
            res.send({ status: "1", user_id: User_Id });
          } else {
            res.send({ status: "0" });
          }
        } else {
          // now we have to register this member in our app
          res.send({ status: "2" });
        }
      }
    }
  );
});

app.post("/syncContactOfUser", urlencodedparser, (req, res) => {
  console.log("user id is", req.body[0]);
  console.log("contact details before decryption: ", req.body[1]);

  fs.writeFile(
    "./numbers/" + req.body[0] + ".txt",
    JSON.stringify(req.body[1]),
    function (err) {
      if (err) {
        console.log("There has been an error saving your configuration data.");
        console.log(err.message);
        return;
      }
      // console.log("Configuration saved successfully.");
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
        counter++;
      }
    }
  }
  console.log("after Prossec number is", Pure_contact_details.length);

  con.query("select * from `login_info`", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      var responseCounter = 0;
      // var isOnSpecifyarray = [];
      console.log("result sunc contact is:  ", result.length);
      for (let i = 0; i < Pure_contact_details.length; i++) {
        for (let j = 0; j < result.length; j++) {
          if (result[j].user_number == Pure_contact_details[i][2]) {
            console.log("yes for : ", i, "  is :", Pure_contact_details[i][2]);
            Pure_contact_details[i][0] = result[j].user_id.toString();
            console.log("after add C_ID : ", Pure_contact_details[i]);
            Pure_contact_details[i][0] = encrypt(Pure_contact_details[i][0]);
            Pure_contact_details[i][2] = encrypt(Pure_contact_details[i][2]);

            console.log("after et enc : ", Pure_contact_details[i]);

            response[responseCounter] = Pure_contact_details[i];
            responseCounter++;
            // isOnSpecifyarray[responseCounter] = 1;
          }
        }
      }
      var isOnnumber = responseCounter;
      // for (let i = 0; i < Pure_contact_details.length; i++) {
      //   if (isOnSpecifyarray[i] == 1) {
      //   } else {
      //     // Pure_contact_details[i][2] = encrypt(Pure_contact_details[i][2]);
      //     response[responseCounter] = Pure_contact_details[i];
      //     responseCounter++;
      //   }
      // }

      console.log("isonnumber is  : ", Pure_contact_details.length);
      console.log("isonnumber is  : ", isOnnumber);

      console.log("response: " + response);

      res.send(response);
    }
  });
});
// end of sync contact

app.post("/SaveFireBaseTokenToServer", urlencodedparser, (req, res) => {
  var user_id = decrypt(req.body.user_login_id);
  var token = decrypt(req.body.tokenFCM);
  console.log("SaveFireBaseTokenToServer : user_id is", user_id ," token: ",token);
  con.query(
    "update `login_info` set `tokenFCM`='" +
      token +
      "' Where `user_id`='" +
      user_id +
      "'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          "result in /SaveFireBaseTokenToServer to register  ",
          result
        );
        if (result.affectedRows > 0) {
          res.send({ status: "1" });
        } else {
          res.send({ status: "2" }); // 2 send when updattion in failed
        }
      }
    }
  );
});
app.post(
  "/GetContactDetailsOfUserToSaveLocally",
  urlencodedparser,
  (req, res) => {
    var array = req.body[0];
    console.log("GetContactDetailsOfUserToSaveLocally || array:", array);
    console.log("GetContactDetailsOfUserToSaveLocally || array 0:", array[0]);
    console.log("GetContactDetailsOfUserToSaveLocally || array 1:", array[1]);
    
    
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
app.post(
  "/uploadmultiple",
  upload.array("myFiles", 12),
  (req, res, next) => {
    const files = req.files;
    if (!files) {
      const error = new Error("Please choose files");
      error.httpStatusCode = 400;
      return next(error);
    }
    res.send(files);
  }
);

