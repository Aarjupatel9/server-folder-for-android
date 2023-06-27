const mongoose = require("mongoose");
const loginSchema = new mongoose.Schema({
  Number: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: Number,
    require: false,
  },
  Name: {
    type: String,
    require: false,
  },

  AccStatus: {
    type: Number,
    required: false,
  },
  tokenFCM: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("loginInfo", loginSchema);
