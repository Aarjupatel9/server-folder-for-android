const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  emailVerification: {
    otp: {
      type: String,
      required: false,
      unique:false
    },
    time: {
      type: Number,
      required: false,
      unique:false
    }
  },
  forgotPassword: {
    otp: {
      type: String,
      required: false,
      unique:false,
    },
    time: {
      type: Number,
      required: false,
      unique:false
    },
    slug: {
      type: String,
      required: false,
      unique: false
    },
    slugTime: {
      type: Number, 
      required: false,
      unique: false
    }
  }
});

module.exports = mongoose.model("authenticationOtps", otpSchema);
