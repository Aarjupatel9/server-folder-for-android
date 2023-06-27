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
    default: [],
  },
});

massegeSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model("massege", massegeSchema);
