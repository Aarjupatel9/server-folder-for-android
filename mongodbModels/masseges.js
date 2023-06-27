const mongoose = require("mongoose");
const massegeSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true,
  },
  user2: {
    type: String,
    require: true,
  },
  massegeHolder: {
    type: Array,
    require: false,
  },
});

module.exports = mongoose.model("massege", massegeSchema);
