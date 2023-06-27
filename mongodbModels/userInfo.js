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
  display_name: {
    type: String,
    require: false,
  },
  onlineStatus: {
    type: Number,
    required: false,
  },
  ProfileImage: {
    data: Buffer,
    contentType: String,
  },
  ProfileImageVersion: {
    type: Number,
    required: false,
  },
});

module.exports = mongoose.model("userInfo", userSchema);
