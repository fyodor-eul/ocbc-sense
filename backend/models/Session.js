const mongoose = require("mongoose");

// Allowed preference values (what the applicant chose; never inferred)
const preferences = {
  wording:   { type: String, enum: ["standard", "simple"] },
  text_size: { type: String, enum: ["default", "large", "xlarge"] },
  language:  { type: String, enum: ["en", "zh", "ms"] },
};

// One document per journey attempt.
const sessionSchema = new mongoose.Schema({
  _id:        { type: String },                     // e.g. "s1761620000000_1" or "syn0001"
  source:     { type: String, enum: ["live", "synthetic"], required: true },
  started_at: { type: Date, required: true },
  ended_at:   { type: Date, default: null },
  outcome:    { type: String, enum: ["in_progress", "submitted", "abandoned", "not_eligible"],
                default: "in_progress" },
  preferences:         preferences,                  // at the start; never changes
  current_preferences: preferences,                  // updated mid-journey
}, { versionKey: false, minimize: false });

sessionSchema.index({ outcome: 1 });                 // dashboard: outcome counts

module.exports = mongoose.model("Session", sessionSchema, "sessions");
