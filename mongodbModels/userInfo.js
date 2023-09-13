const mongoose = require("mongoose");

const ContactsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
    ref: 'userInfos',
    required: true,
  },
  Name: {
    type: String,
    required: true,
  },
  Number: {
    type: String,
    required: true,
  },
  blocked: {
    type: Boolean,
    required: false,
  }
});
const userSchema = new mongoose.Schema({
  about: {
    type: String,
    required: false,
  },
  Contacts: {
    type: Array,
    require: false,
  },
  Contacts: {
    type: [ContactsSchema],
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

module.exports = mongoose.model("userInfos", userSchema);
