// Tests Socket.IO: plays both an applicant and a staff console, through a full chat.
// Usage: node test-client.js <session_id>
const { io } = require("socket.io-client");

const URL = process.env.SERVER || "http://localhost:3000";
const sessionId = process.argv[2];
if (!sessionId) {
  console.log("Usage: node test-client.js <session_id>");
  process.exit(1);
}

const consoleSocket = io(URL);
const applicant = io(URL);

// ---- console side
consoleSocket.on("connect", () => {
  consoleSocket.emit("join_console");
  console.log("console: connected and joined");
});
consoleSocket.on("handoff:queue", (q) => console.log("console: open requests on join ->", q.length));
consoleSocket.on("insights:update", () => {});

consoleSocket.on("handoff:new", (h) => {
  console.log(`console: help request #${h.handoff_no} for step ${h.share.step_no},`,
              `shared fields: ${Object.keys(h.share).join(", ")}, recent events: ${h.events.length}`);
  consoleSocket.emit("handoff:accepted", { session_id: h.session_id, staff_name: "Sherry" }, (res) => {
    console.log("console: pick up ->", res);
    // a second pick-up (e.g. another staff member) is refused
    consoleSocket.emit("handoff:accepted", { session_id: h.session_id, staff_name: "Ali" },
      (res2) => console.log("console: second pick up ->", res2));
  });
});
consoleSocket.on("handoff:taken", (t) => {
  console.log(`console: taken by ${t.staff_name}`);
  consoleSocket.emit("handoff:message", { session_id: sessionId, text: "Try removing your phone case." });
});
consoleSocket.on("handoff:reply", (m) => {
  console.log("console: applicant says ->", m.text);
  // simulate the applicant refreshing the page: a new connection gets the chat so far
  const refreshed = io(URL);
  refreshed.on("connect", () => refreshed.emit("join_session", { session_id: sessionId }));
  refreshed.on("handoff:history", (hist) => {
    console.log(`applicant (after refresh): history has ${hist.messages.length} messages, staff ${hist.staff_name}`);
    refreshed.close();
    consoleSocket.emit("handoff:resolved", { session_id: sessionId });
  });
});

// ---- applicant side
applicant.on("connect", () => {
  console.log("applicant: connected");
  applicant.emit("join_session", { session_id: sessionId }, () => {
    applicant.emit("event",
      { session_id: sessionId, page_id: "account.step3", type: "error:NFC_READ_FAILED" },
      (res) => console.log("applicant: event ack ->", res));
    applicant.emit("event",
      { session_id: sessionId, page_id: "account.step3", type: "error:NOT_A_REAL_CODE" },
      (res) => console.log("applicant: bad event ack ->", res));
    setTimeout(() => applicant.emit("handoff:request", {
      session_id: sessionId, page_id: "account.step3",
      share: { step_no: 3, step_title: "Scan your passport chip", trigger: "repeated_errors",
               last_error: "NFC_READ_FAILED", failed_attempts: 2, back_count: 0, time_on_step_s: 78,
               passport_number: "A1234567" },          // not an allowed field: the server drops it
    }, (res) => console.log("applicant: request ->", res)), 300);
  });
});
applicant.on("handoff:accepted", (a) => console.log(`applicant: ${a.staff_name} has joined`));
applicant.on("handoff:message", (m) => {
  console.log("applicant: staff says ->", m.text);
  applicant.emit("handoff:reply", { session_id: sessionId, text: "Still failing. My passport is A1234567" });
});
applicant.on("handoff:resolved", async () => {
  const res = await fetch(`${URL}/api/sessions/${sessionId}/messages`);
  const saved = await res.json();
  console.log(`applicant: resolved. Saved messages: ${saved.length}. All tests done.`);
  process.exit(0);
});

setTimeout(() => {
  console.log("Timed out: is the server running?");
  process.exit(1);
}, 8000);
