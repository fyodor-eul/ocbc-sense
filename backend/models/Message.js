const mongoose = require("mongoose");

// One document per chat message between an applicant and staff (masked, max 300 characters).
const messageSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  handoff_no: { type: Number, required: true },              // 1st, 2nd… request for help in this session
  page_id:    { type: String, required: true },              // the step the chat happened on
  sender:     { type: String, enum: ["customer", "staff"], required: true },
  staff_name: { type: String, default: null },               // staff messages only
  text:       { type: String, required: true, maxlength: 300 },
  source:     { type: String, enum: ["live", "synthetic"], required: true },
  time:       { type: Date, required: true },
}, { versionKey: false });

messageSchema.index({ session_id: 1, time: 1 });          // one conversation, in order
// Optional retention: MongoDB deletes messages automatically after 30 days.
// messageSchema.index({ time: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

module.exports = mongoose.model("Message", messageSchema, "messages");
