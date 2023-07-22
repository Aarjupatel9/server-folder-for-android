const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({

  emailVerification: {
    otp: {
      type: String,
      required: false,
    },
    time: {
      type: Number,
      required: false,
    }
  },
  forgotPassword: {
    otp: {
      type: String,
      required: false,
    },
    time: {
      type: Number,
      required: false,
    },
    slug: {
      type: String,
      required: false,
    },
    slugTime: {
      type: Number, 
      required: false
    }
  }
});

module.exports = mongoose.model("authenticationOtp", otpSchema);
