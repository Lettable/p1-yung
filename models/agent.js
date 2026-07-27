const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agentSchema = new Schema({
  number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

module.exports = mongoose.model("Agent", agentSchema);
