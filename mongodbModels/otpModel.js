const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({

  emailVerification: {
    otp: {
      type: String,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    }
  },
  forgotPassword: {
    otp: {
      type: String,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    }
  }
});

module.exports = mongoose.model("authenticationOtp", otpSchema);
