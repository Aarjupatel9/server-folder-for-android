const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true,
    unique: true,
  },
  time: {
    type: Number,
    require: true,
  }
});

module.exports = mongoose.model("authenticationOtp", otpSchema);
