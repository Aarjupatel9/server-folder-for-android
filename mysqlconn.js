const mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "android_studio",
  port: "3306",
});

// con.on("")

module.exports = con;