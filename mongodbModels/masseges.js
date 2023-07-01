const mongoose = require("mongoose");

const massegeHolderSchema = new mongoose.Schema({
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
});

const massegeSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true,
  },
  user2: {
    type: String,
    required: true,
  },
  massegeHolder: {
    type: [massegeHolderSchema],
    validate: {
      validator: function (arr) {
        // Validate uniqueness of 'time' within the array
        const uniqueTimes = new Set(
          arr.map((obj) => {
            return obj.time;
          })
        );
            console.log("enter in validator , arr,lenght : ", arr.length, " and : ", uniqueTimes.length);
        return uniqueTimes.size === arr.length;
      },
      message: "Duplicate 'time' values found in massegeHolder array",
    },
  },
});

// massegeSchema.index({ "massegeHolder.time": 1 }, { unique: true });

module.exports = mongoose.model("massege", massegeSchema);
