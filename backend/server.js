const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const Page = require("./models/Page");
const Session = require("./models/Session");
const Event = require("./models/Event");
const Message = require("./models/Message");
const { EVENT_TYPES, SERVER_ONLY_TYPES } = Event;
const BROWSER_EVENT_TYPES = EVENT_TYPES.filter((t) => !SERVER_ONLY_TYPES.includes(t));

const app = express();
app.use(cors());                 // let the React apps (another origin) call the REST API
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---------- database ----------
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";

// ---------- allowed values ----------
const PATCH_OUTCOMES = ["abandoned", "not_eligible"];   // "submitted" is set by /api/applications
const ELIGIBLE_COUNTRIES = ["HK", "MY", "ID", "CN"];     // Hong Kong, Malaysia, Indonesia, Mainland China

// ---------- REST: eligibility (nothing stored) ----------
app.post("/api/eligibility", (req, res) => {
  const { passport_country, is_18_or_older } = req.body;
  if (!ELIGIBLE_COUNTRIES.includes(passport_country))
    return res.json({ eligible: false, code: "COUNTRY_NOT_SUPPORTED" });
  if (is_18_or_older !== true)
    return res.json({ eligible: false, code: "AGE_REQUIREMENT" });
  res.json({ eligible: true });
});

// ---------- REST: sessions (one per journey attempt) ----------
let counter = 0;
app.post("/api/sessions", async (req, res) => {
  const preferences = req.body.preferences || {};   // optional; empty if not sent
  const id = "s" + Date.now() + "_" + ++counter;
  await Session.create({
    _id: id, source: "live",
    started_at: new Date(), preferences, current_preferences: preferences,
  });
  res.status(201).json({ session_id: id });
});

app.patch("/api/sessions/:id", async (req, res) => {
  const { current_preferences, outcome } = req.body;   // only these fields
  const update = {};
  if (current_preferences) update.current_preferences = current_preferences;
  if (outcome) {
    if (!PATCH_OUTCOMES.includes(outcome)) return res.status(400).json({ error: "bad_outcome" });
    update.outcome = outcome;
    update.ended_at = new Date();
  }
  const r = await Session.updateOne({ _id: req.params.id }, { $set: update }, { runValidators: true });
  if (r.matchedCount === 0) return res.sendStatus(404);
  if (outcome) io.to("console").emit("insights:update");   // the Escalated tab moves the row
  res.sendStatus(204);
});

// ---------- REST: submit application (mock) ----------
app.post("/api/applications", async (req, res) => {
  const { session_id } = req.body;
  const r = await Session.updateOne(
    { _id: session_id, outcome: "in_progress" },
    { $set: { outcome: "submitted", ended_at: new Date() } }
  );
  if (r.matchedCount === 0) return res.status(400).json({ error: "session_not_active" });
  io.to("console").emit("insights:update");                // the Escalated tab moves the row
  const reference = "APP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  res.status(201).json({ reference });   // shown on screen only, not stored
});

// ---------- REST: insights ----------
app.get("/api/insights/friction", async (req, res) => {
  const rows = await Event.aggregate([
    { $match: { type: /^friction:/ } },
    { $group: { _id: { page: "$page_id", type: "$type" }, count: { $sum: 1 } } },
  ]);
  res.json(rows);
});

// ---------- REST: AI explain (calls the AI service) ----------
const AI_URL = process.env.AI_URL || "http://localhost:3001";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 15000;   // small local models are slow

// hide anything that looks like an ID: 6+ letters/digits containing a digit (e.g. A1234567)
const maskIds = (text) => text.replace(/\b(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{6,}\b/g, "[hidden]");

app.post("/api/explain", async (req, res) => {
  const { session_id, page_id, question } = req.body;
  if (typeof question !== "string" || !question.trim() || question.length > 300)
    return res.status(400).json({ error: "bad_question" });

  const session = await Session.findById(session_id).lean();
  if (!session) return res.status(400).json({ error: "unknown_session" });
  const page = await Page.findById(page_id).lean();
  if (!page || !page.step_no) return res.status(400).json({ error: "unknown_page" });

  // context: built here, from the database, never from the browser
  const prefs = session.current_preferences || {};
  const wording = prefs.wording || "standard";
  const lastError = await Event.findOne({ session_id, page_id, type: /^error:/ }).sort({ time: -1 }).lean();

  const context = {
    question: maskIds(question),
    step: page.step_no,
    stepTitle: page.title,
    stepText: page.text[wording],
    verifiedInfo: page.verified_info,
    lastError: lastError ? lastError.type.slice("error:".length) : null,
    wording,
    language: prefs.language || "en",
  };

  // ask the AI service; any problem (down, slow, bad reply) = fallback
  let result;
  try {
    const r = await fetch(`${AI_URL}/api/ai/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    result = await r.json();
    if (!r.ok && result.fallback !== true) throw new Error(result.error || "ai_error");
  } catch (err) {
    console.error("AI service:", err.message);
    result = { type: "ai_answer", answer: null, fallback: true };
  }

  // log that a question was answered (no question text), then refresh the charts
  await Event.create({ session_id, page_id, type: "ai_question", source: session.source, time: new Date() });
  io.to("console").emit("insights:update");

  res.json({
    type: result.type || "ai_answer",
    answer: result.answer ?? null,
    fallback: result.fallback === true,
    action: result.action ?? null,
    value: result.value ?? null,
  });
});

// ---------- REST: chat transcript (for the staff console) ----------
app.get("/api/sessions/:id/messages", async (req, res) => {
  const messages = await Message.find({ session_id: req.params.id }, { _id: 0, source: 0 })
    .sort({ time: 1 }).lean();
  res.json(messages);
});

// ---------- REST: hand-offs (for the console's Escalated tab) ----------
const seconds = (from, to) => (from && to ? Math.round((to - from) / 1000) : null);

app.get("/api/handoffs", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  // the latest help request of each session: live ones first, then newest first
  const latest = await Event.aggregate([
    { $match: { type: "handoff_request" } },
    { $sort: { time: -1 } },
    { $group: { _id: "$session_id", page_id: { $first: "$page_id" }, source: { $first: "$source" },
                requested_at: { $first: "$time" }, handoff_count: { $sum: 1 } } },
    { $addFields: { is_live: { $eq: ["$source", "live"] } } },
    { $sort: { is_live: -1, requested_at: -1 } },
    { $limit: limit },
  ]);
  const ids = latest.map((h) => h._id);

  const [sessions, pages, steps, errors, counts] = await Promise.all([
    Session.find({ _id: { $in: ids } }).lean(),
    Page.find({}, { title: 1, step_no: 1 }).lean(),
    Event.find({ session_id: { $in: ids }, type: { $in: ["handoff_accepted", "handoff_resolved"] } },
               { _id: 0, session_id: 1, type: 1, time: 1 }).sort({ time: 1 }).lean(),
    Event.find({ session_id: { $in: ids }, type: /^error:/ },
               { _id: 0, session_id: 1, page_id: 1, type: 1, time: 1 }).sort({ time: -1 }).lean(),
    Message.aggregate([{ $match: { session_id: { $in: ids } } },
                       { $group: { _id: "$session_id", n: { $sum: 1 } } }]),
  ]);
  const sessionById = new Map(sessions.map((s) => [s._id, s]));
  const pageById = new Map(pages.map((p) => [p._id, p]));
  const countById = new Map(counts.map((c) => [c._id, c.n]));

  res.json(latest.map((h) => {
    const s = sessionById.get(h._id) || {};
    const page = pageById.get(h.page_id) || {};
    // pick-up and resolve that belong to this (latest) request
    const accepted = steps.find((e) => e.session_id === h._id && e.type === "handoff_accepted" && e.time >= h.requested_at);
    const resolved = steps.find((e) => e.session_id === h._id && e.type === "handoff_resolved" && e.time >= h.requested_at);
    // last error on that step, before help was requested
    const lastError = errors.find((e) => e.session_id === h._id && e.page_id === h.page_id && e.time <= h.requested_at);
    return {
      session_id: h._id,
      source: s.source || "live",
      outcome: s.outcome || "in_progress",
      handoff_count: h.handoff_count,
      status: resolved ? "resolved" : accepted ? "active" : "waiting",
      page_id: h.page_id,
      step_no: page.step_no ?? null,
      step_title: page.title || h.page_id,
      last_error: lastError ? lastError.type.slice("error:".length) : null,
      requested_at: h.requested_at,
      accepted_at: accepted?.time || null,
      resolved_at: resolved?.time || null,
      wait_s: seconds(h.requested_at, accepted?.time),
      help_s: seconds(accepted?.time, resolved?.time),
      ended_at: s.ended_at || null,
      message_count: countById.get(h._id) || 0,
    };
  }));
});

// ---------- REST: errors ----------
// Mongoose rejects values that don't match a schema (e.g. language: "fr") → 400
app.use((err, req, res, next) => {
  if (err.name === "ValidationError" || err.name === "CastError")
    return res.status(400).json({ error: "invalid_data", fields: Object.keys(err.errors || { [err.path]: 1 }) });
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

// ---------- Socket.IO ----------
// Help requests that are still open, by session_id. Kept in memory: a server restart clears the queue.
const openHandoffs = new Map();   // session_id → { session_id, page_id, handoff_no, share, events, requested_at, staff_name }

// Only these fields of `share` are passed on to staff (what the share preview shows)
const SHARE_FIELDS = ["step_no", "step_title", "trigger", "last_error", "failed_attempts",
                      "back_count", "time_on_step_s", "preferences"];
const pick = (obj = {}, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

// chat text: trimmed, ID-like numbers hidden, max 300 characters
const cleanText = (t) => (typeof t === "string" ? maskIds(t.trim()).slice(0, 300) : "");

// while a hand-off is open, keep its card up to date: new step, latest error, event stream
async function updateOpenHandoff(e, time) {
  const h = openHandoffs.get(e.session_id);
  if (!h) return;
  h.events = [{ type: e.type, time }, ...h.events].slice(0, 10);
  if (e.type === "page_view" && e.page_id !== h.current_page_id) {
    const page = await Page.findById(e.page_id, { title: 1, step_no: 1 }).lean();
    if (page?.step_no) {                          // moved to another step: fresh counters
      h.current_page_id = e.page_id;
      h.share = { ...h.share, step_no: page.step_no, step_title: page.title, last_error: null, failed_attempts: 0 };
    }
  } else if (e.type.startsWith("error:") && e.page_id === h.current_page_id) {
    h.share = { ...h.share, last_error: e.type.slice(6), failed_attempts: (h.share.failed_attempts || 0) + 1 };
  }
  io.to("console").emit("handoff:progress", h);
}

// write a server-only hand-off event (handoff_request / _accepted / _resolved)
async function logHandoff(h, type) {
  const session = await Session.findById(h.session_id).lean();
  await Event.create({ session_id: h.session_id, page_id: h.page_id, type,
                       source: session?.source || "live", time: new Date() });
  io.to("console").emit("insights:update");
}

// save one chat message, then send it to the applicant's room and to every console
async function sendChat(h, sender, text, staff_name = null) {
  const session = await Session.findById(h.session_id).lean();
  const msg = await Message.create({ session_id: h.session_id, handoff_no: h.handoff_no, page_id: h.page_id,
                                     sender, staff_name, text, source: session?.source || "live", time: new Date() });
  const out = { session_id: msg.session_id, handoff_no: msg.handoff_no, sender, staff_name, text, time: msg.time };
  const name = sender === "staff" ? "handoff:message" : "handoff:reply";
  io.to("session:" + h.session_id).to("console").emit(name, out);
}

io.on("connection", (socket) => {
  // ----- consoles -----
  // the console tells the server who it is, and gets the open queue (also after a refresh)
  socket.on("join_console", () => {
    socket.join("console");
    socket.emit("handoff:queue", [...openHandoffs.values()]);
  });

  // ----- applicants -----
  // the customer app joins its session's room (on every connect), and gets an open chat back
  socket.on("join_session", async (d, ack) => {
    if (!d?.session_id) return ack?.({ ok: false, error: "unknown_session" });
    socket.join("session:" + d.session_id);
    const h = openHandoffs.get(d.session_id);
    if (h) {
      const messages = await Message.find({ session_id: h.session_id, handoff_no: h.handoff_no },
                                          { _id: 0, source: 0 }).sort({ time: 1 }).lean();
      socket.emit("handoff:history", { session_id: h.session_id, handoff_no: h.handoff_no,
                                       staff_name: h.staff_name, messages });
    }
    ack?.({ ok: true });
  });

  // events from the customer app (only during a journey)
  socket.on("event", async (e, ack) => {
    try {
      if (!BROWSER_EVENT_TYPES.includes(e?.type)) return ack?.({ ok: false, error: "unknown_type" });
      const session = await Session.findById(e.session_id).lean();
      if (!session) return ack?.({ ok: false, error: "unknown_session" });

      const time = new Date();
      await Event.create({
        session_id: e.session_id, page_id: e.page_id, type: e.type,
        source: session.source, time,
      });
      io.to("console").emit("insights:update");   // charts refresh
      await updateOpenHandoff(e, time);           // staff with an open chat see where the user is now
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: "invalid_event" });  // e.g. missing page_id
    }
  });

  // ----- hand-off -----
  // applicant asks for a person
  socket.on("handoff:request", async (d, ack) => {
    try {
      const session = await Session.findById(d?.session_id).lean();
      if (!session) return ack?.({ ok: false, error: "unknown_session" });
      if (openHandoffs.has(d.session_id)) return ack?.({ ok: false, error: "already_open" });

      socket.join("session:" + d.session_id);
      const handoff_no = 1 + await Event.countDocuments({ session_id: d.session_id, type: "handoff_request" });
      const recent = await Event.find({ session_id: d.session_id, page_id: d.page_id }, { _id: 0, type: 1, time: 1 })
        .sort({ time: -1 }).limit(10).lean();
      const h = { session_id: d.session_id, page_id: d.page_id, handoff_no,
                  share: pick(d.share, SHARE_FIELDS), events: recent,
                  requested_at: new Date(), staff_name: null, current_page_id: d.page_id };
      openHandoffs.set(d.session_id, h);
      await logHandoff(h, "handoff_request");

      io.to("console").emit("handoff:new", h);
      const staffOnline = io.sockets.adapter.rooms.get("console")?.size || 0;
      ack?.({ ok: true, handoff_no, staff_online: staffOnline });   // 0 → "no staff online right now"
    } catch (err) {
      ack?.({ ok: false, error: "invalid_request" });
    }
  });

  // staff picks a request up
  socket.on("handoff:accepted", async (d, ack) => {
    const h = openHandoffs.get(d?.session_id);
    if (!h) return ack?.({ ok: false, error: "not_open" });
    if (h.staff_name) return ack?.({ ok: false, error: "already_taken" });
    h.staff_name = (typeof d.staff_name === "string" && d.staff_name.trim().slice(0, 50)) || "Staff";
    await logHandoff(h, "handoff_accepted");
    io.to("session:" + h.session_id).emit("handoff:accepted", { session_id: h.session_id, staff_name: h.staff_name });
    io.to("console").emit("handoff:taken", { session_id: h.session_id, staff_name: h.staff_name });
    ack?.({ ok: true });
  });

  // staff → applicant
  socket.on("handoff:message", async (d, ack) => {
    const h = openHandoffs.get(d?.session_id);
    if (!h) return ack?.({ ok: false, error: "not_open" });
    if (!h.staff_name) return ack?.({ ok: false, error: "not_picked_up" });   // pick it up first
    const text = cleanText(d.text);
    if (!text) return ack?.({ ok: false, error: "bad_text" });
    await sendChat(h, "staff", text, h.staff_name);
    ack?.({ ok: true });
  });

  // applicant → staff
  socket.on("handoff:reply", async (d, ack) => {
    const h = openHandoffs.get(d?.session_id);
    if (!h) return ack?.({ ok: false, error: "not_open" });
    const text = cleanText(d.text);
    if (!text) return ack?.({ ok: false, error: "bad_text" });
    await sendChat(h, "customer", text);
    ack?.({ ok: true });
  });

  // staff closes the hand-off; the applicant carries on from the same step
  socket.on("handoff:resolved", async (d, ack) => {
    const h = openHandoffs.get(d?.session_id);
    if (!h) return ack?.({ ok: false, error: "not_open" });
    openHandoffs.delete(h.session_id);
    await logHandoff(h, "handoff_resolved");
    io.to("session:" + h.session_id).to("console").emit("handoff:resolved", { session_id: h.session_id });
    ack?.({ ok: true });
  });
});

// ---------- start ----------
mongoose.connect(MONGO_URL, { dbName: "askdontassume" })
  .then(() => {
    const port = process.env.PORT || 3000;
    server.listen(port, "0.0.0.0", () => console.log(`Server on :${port}`));
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });
