const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({

  emailVerification: {
    otp: {
      type: String,
      required: true,
      unique:false
    },
    time: {
      type: Number,
      required: true,
      unique:false
    }
  },
  forgotPassword: {
    otp: {
      type: String,
      required: true,
      unique:false,
    },
    time: {
      type: Number,
      required: true,
      unique:false
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
