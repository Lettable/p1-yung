const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  path: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    default: "wav",
  },
  size: Number,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  outro: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Audio", audioSchema);
