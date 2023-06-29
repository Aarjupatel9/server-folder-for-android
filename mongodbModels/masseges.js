// const mongoose = require("mongoose");

// const massegeSchema = new mongoose.Schema({
//   user1: {
//     type: String,
//     required: true,
//   },
//   user2: {
//     type: String,
//     require: true,
//   },
//   massegeHolder: [
//     {
//       from: {
//         type: String,
//         required: true,
//       },
//       to: {
//         type: String,
//         required: true,
//       },
//       massege: {
//         type: String,
//         required: true,
//       },
//       chatId: {
//         type: String,
//         required: true,
//       },
//       time: {
//         type: Number,
//         required: true,
//         unique: true,
//       },
//       massegeStatus: {
//         type: Number,
//         required: true,
//       },
//       massegeStatusL: {
//         type: Number,
//         required: true,
//       },
//       ef1: {
//         type: Number,
//         required: true,
//       },
//       ef2: {
//         type: Number,
//         required: true,
//       },
//     },
//   ],
// });

// // massegeSchema.plugin(uniqueValidator, {
// //   message: "Error, {PATH} must be unique.",
// // });

// // massegeSchema.index({ user1: 1, user2: 1 }, { unique: true });

// module.exports = mongoose.model("massege", massegeSchema);

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
  massegeHolder: [massegeHolderSchema],
});

module.exports = mongoose.model("massege", massegeSchema);
