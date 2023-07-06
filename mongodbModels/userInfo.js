const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  about: {
    type: String,
    required: false,
  },
  Contacts: {
    type: Array,
    require: false,
  },
  displayName: {
    type: String,
    require: false,
  },
  onlineStatus: {
    type: Number,
    required: false,
  },
  onlineStatusPolicy: {
    type: Number,
    required: false,
  },
  ProfileImage: {
    type: Buffer,
    require: false,
  },
  ProfileImageVersion: {
    type: Number,
    required: false,
  },
});

module.exports = mongoose.model("userInfo", userSchema);
