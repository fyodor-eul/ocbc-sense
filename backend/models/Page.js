const mongoose = require("mongoose");

// One document per screen. Loaded by seed.js; never changes during the demo.
const pageSchema = new mongoose.Schema({
  _id:           { type: String },                  // e.g. "account.step3"
  step_no:       { type: Number, default: null },   // 1–6, or null for non-step pages
  title:         { type: String, required: true },
  text: {
    standard:    { type: String, required: true },
    simple:      { type: String, required: true },
  },
  verified_info: { type: String, default: null },   // checked facts the AI builds on
  suggested_questions: { type: [String], default: [] },
}, { versionKey: false });

module.exports = mongoose.model("Page", pageSchema, "pages");
