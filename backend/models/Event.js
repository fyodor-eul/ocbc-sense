const mongoose = require("mongoose");

// Every allowed event type, written as "category" or "category:value"
const ERROR_CODES = [
  "COUNTRY_NOT_SUPPORTED", "AGE_REQUIREMENT", "CHECKLIST_INCOMPLETE",
  "NFC_NOT_SUPPORTED", "NFC_CHIP_NOT_FOUND", "NFC_READ_FAILED",
  "ID_UNREADABLE", "VERIFICATION_FAILED",
  "DOC_MISSING", "DOC_UNREADABLE", "DOC_WRONG_TYPE",
  "CONTACT_MOBILE_INVALID", "CONTACT_EMAIL_INVALID", "DECLARATION_REQUIRED",
];

const EVENT_TYPES = [
  // navigation
  "page_view", "journey_complete", "journey_abandon",
  // friction (every friction shows the offer card)
  "friction:long_pause", "friction:back_and_forth", "friction:repeated_errors",
  // offer card responses (AI or person is worked out from the events that follow)
  "offer_accepted", "offer_declined",
  // mode bar: one category per setting, value = the new choice
  "language_change:en", "language_change:zh", "language_change:ms",
  "wording_change:standard", "wording_change:simple",
  "text_size_change:default", "text_size_change:large", "text_size_change:xlarge",
  // help
  "ai_question",   // a question was answered (outcome is worked out from what the applicant does next)
  // errors
  ...ERROR_CODES.map((code) => `error:${code}`),
  // hand-off
  "handoff_request", "handoff_accepted", "handoff_resolved",
];

// Types only the server writes (the browser may not send these)
const SERVER_ONLY_TYPES = EVENT_TYPES.filter(
  (t) => t === "ai_question" || t.startsWith("handoff_")
);

// One small document for every action or signal during a journey.
const eventSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  page_id:    { type: String, required: true },
  type:       { type: String, enum: EVENT_TYPES, required: true },
  source:     { type: String, enum: ["live", "synthetic"], required: true },
  time:       { type: Date, required: true },
}, { versionKey: false });

eventSchema.index({ page_id: 1, type: 1 });          // dashboard: counts per page
eventSchema.index({ session_id: 1, time: -1 });      // AI and console: latest events

module.exports = mongoose.model("Event", eventSchema, "events");
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.SERVER_ONLY_TYPES = SERVER_ONLY_TYPES;
