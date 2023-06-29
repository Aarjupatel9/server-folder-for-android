const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const massegeSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true,
  },
  user2: {
    type: String,
    require: true,
  },
  massegeHolder: [
    {
      from: {
        type: String,
        required: true,
      },
      to: {
        type: String,
        required: true,
      },
      massege: {
        type: String,
        required: true,
      },
      chatId: {
        type: String,
        required: true,
      },
      time: {
        type: Number,
        required: true,
        unique: true,
      },
      massegeStatus: {
        type: Number,
        required: true,
      },
      massegeStatusL: {
        type: Number,
        required: true,
      },
      ef1: {
        type: Number,
        required: true,
      },
      ef2: {
        type: Number,
        required: true,
      },
    },
  ],
});

massegeSchema.path("user2").validate(async function (value) {
  const user1 = this.user1;

  // Allow the combination of user1 and user2 to be unique only if they are both equal
  if (user1 === value) {
    return true;
  }

  const count = await this.model("massege").countDocuments({
    $or: [
      { user1: user1, user2: value },
      { user1: value, user2: user1 },
    ],
  });
  return count === 0;
}, "Combination of User1 and User2 must be unique.");

massegeSchema.plugin(uniqueValidator, {
  message: "Error, {PATH} must be unique.",
});

massegeSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model("massege", massegeSchema);
