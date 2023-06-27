const mongoose = require("mongoose");
const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    require: false,
    default: 0,
  },
  keywords: {
    type: Array,
    require: false,
  },

  description: {
    type: String,
    required: true,
  },
  photo: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = mongoose.model("loginInfo", BlogSchema);
