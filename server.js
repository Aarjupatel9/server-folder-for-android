const express = require("express");
const con = require("./mysqlconn");

const app = express();

var bodyParser = require("body-parser");
const { query, json } = require("express");
var urlencodedparser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ limit: "200kb" }));
app.use(bodyParser.urlencoded({ limit: "200kb", extended: true }));
var counter = 0;
const port = 10000;
const main_url = "192.168.43.48";
const socket_url = "192.168.43.48:3110";



app.post("/", (req, res) => {
  console.log(req);
  res.send({ name: "aarju" });
});

app.get("/getUserDetails", (req, res) => {
  con.query(
    "select * from `login_info` where `user_id`='1'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log("result in /getUserdetsils ", result);
        var jd = JSON.stringify(result);
        res.send(jd);
      }
    }
  );
});

app.get("/", (req, res) => {
  con.query(
    "select * from `massege` where `receiver_id`='2'",
    function (err, result) {
      if (err) {
        console.log("errr in / ", err);
      } else {
        console.log("result in / ", result);
        var jd = JSON.stringify(result);

        setTimeout(() => {
          res.send(jd);
        }, 1000);
        // res.send(jd);
      }
    }
  );
});

app.post("/sendMassegeToServer", urlencodedparser, (req, res) => {
  var user_login_id = req.body.user_login_id
  counter++;
  console.log("counter is : ", counter);

  console.log("C_ID is", req.body.C_ID);
  console.log("user_login_id is", user_login_id);
  console.log("massege is", req.body.massege);
  // res.send({ status: "0" });

  con.query(
    "insert into `massege`(`sender_id`, `receiver_id`, `massage`, `View_Status`) VALUES ('" +
      user_login_id +
      "','" +
      req.body.C_ID +
      "','" +
      req.body.massege +
      "','0')",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {

        if (result.affectedRows > 0) {
          res.send({ status: "1" });
        }

        // SocketCommunicationMassegeSend(socket_url, {
        //   user_id: user_login_id,
        // }).then((data) => {
        //   console.log(data); 
        // });

        
      }
    }
  );
});
app.post("/checkHaveToRegister", urlencodedparser, (req, res) => {
  console.log("number is", req.body.number);
  con.query(
    "select * from `login_info` Where `user_number`='" + req.body.number + "'",
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
          res.send({ status: "2" });
        }
      }
    }
  );
});

app.post("/syncContactOfUser", urlencodedparser, (req, res) => {
  // console.log("number is", req.body.ContactDetails);

  var ContactDetails = req.body.ContactDetails;
  var array_contactDetails = JSON.parse(ContactDetails);
  var Pure_contact_details = [];
  var response = [];

  function checkNumber(number) {
    let isnum = /^\d+$/.test(number);
    if (isnum) {
      return true;
    }
  }

  var counter = 0;
  for (let i = 0; i < array_contactDetails.length; i++) {
    if (array_contactDetails[i].number[0] == "+") {
      // console.log('enter in slice');
      array_contactDetails[i].number = array_contactDetails[i].number.slice(3);
    }
    if (checkNumber(array_contactDetails[i].number)) {
      var Allowed = true;
      for (let j = 0; j < Pure_contact_details.length; j++) {
        // console.log("enter here");
        if (array_contactDetails[i].number === Pure_contact_details[j].number) {
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
  console.log("after Prossec number is", Pure_contact_details);

  //for easy way less load on server but more database
  // var sql = "select * from `login_info` Where `user_number`=''";
  // for (let i = 0; i < Pure_contact_details.length; i++) {
  //   if (i < Pure_contact_details.length) {
  //     sql = sql + Pure_contact_details[i].number + "' OR `user_number`='";
  //   } else {
  //     sql = sql + Pure_contact_details[i].number + "'";
  //   }
  // }
  // // console.log("sql is ", sql);
  // console.log("sql is ", sql.length);
  // con.query(sql, function (err, result) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log("result sunc contact is:  ", result.length);
  //   }
  // });

  con.query("select * from `login_info`", function (err, result) {
    if (err) {
      console.log(err);
    } else {
      var responseCounter = 0;
      var isOnSpecifyarray = [];
      console.log("result sunc contact is:  ", result.length);
      for (let i = 0; i < Pure_contact_details.length; i++) {
        for (let j = 0; j < result.length; j++) {
          if (result[j].user_number == Pure_contact_details[i].number) {
            console.log(
              "yes for : ",
              i,
              "  is :",
              Pure_contact_details[i].number
            );
            Pure_contact_details[i]["C_ID"] = result[j].user_id;
            console.log("after et C_ID : ", result[j].user_id);
            console.log("after et C_ID : ", Pure_contact_details[i]);

            response[responseCounter] = Pure_contact_details[i];
            responseCounter++;
            isOnSpecifyarray[responseCounter] = 1;
          }
        }
      }
      var isOnnumber = responseCounter;
      for (let i = 0; i < Pure_contact_details.length; i++) {
        if (isOnSpecifyarray[i] != 1) {
          response[responseCounter] = Pure_contact_details[i];
          responseCounter++;
        }
      }

      console.log("isonnumber is  : ", Pure_contact_details.length);
      console.log("isonnumber is  : ", array_contactDetails.length);
      console.log("isonnumber is  : ", isOnnumber);

      var ja = JSON.stringify(response);
      res.send({ ja: ja, isOnnumber: isOnnumber });
    }
  });

  // response = [
  //   {
  //     isOnMassengerID: "aarju",
  //   },
  // ];
});
app.post("/syncNewMassegeFromServer", urlencodedparser, (req, res) => {


  var user_login_id = req.body.user_login_id;
  var response = [];
  var responseCounter = 0;
  console.log("user_login_id is", user_login_id);

  con.query(
    "select * from `massege` where (`sender_id`='" +
      user_login_id +
      "' OR `receiver_id`='" +
      user_login_id +
      "') and `localDatabase_Status`='0'",
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        for (let i = 0; i < result.length; i++) {
          const element = result[i];
          console.log("masssege is : ", element.massage);
          response[responseCounter] = element;
          responseCounter++;
        }
        var ja = JSON.stringify(response);
        res.send(ja);
        console.log("respone is sent");
        runUpdateQuery();
      }
    }
  );
  function runUpdateQuery() {
    con.query(
      "update  `massege` set `localDatabase_Status`='1' where (`sender_id`='" +
        user_login_id +
        "' OR `receiver_id`='" +
        user_login_id +
        "') and `localDatabase_Status`='0'",
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
        }
      }
    );
  }
});

app.listen(port, main_url, function () {
  console.log("app is listening on port : ", port);
});
// app.listen(port, "100.96.201.43", function () {
//   console.log("app is listening on port : ", port);
// });







async function SocketCommunicationMassegeSend(url , data) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}