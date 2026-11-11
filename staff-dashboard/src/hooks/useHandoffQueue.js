// Live queue of help requests, in the same shape as mockData.js's `applicants`.
// Open requests arrive on join (handoff:queue) and live (handoff:new); picked-up and resolved ones update.
import { useEffect, useState } from "react";
import { socket } from "../socket";

const TRIGGER_LABELS = {
  repeated_errors: "Action failed twice",
  long_pause: "No input for 45s",
  back_and_forth: "Back used twice",
};

const hhmm = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const hhmmss = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const mmss = (seconds) =>
  seconds == null
    ? "—"
    : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

// one server event → one row of the "Real-Time Event Stream"
function toStreamEvent(e) {
  const [category, value] = e.type.split(":");
  const row = { time: hhmmss(e.time), type: "success", message: e.type, code: null };
  if (category === "error") return { ...row, type: "error", message: "Action failed", code: value };
  if (category === "friction") return { ...row, type: "warning", message: `Friction: ${value.replace(/_/g, " ")}` };
  if (e.type === "page_view") return { ...row, message: "Opened this step" };
  if (e.type === "offer_accepted") return { ...row, message: "Accepted the help offer" };
  if (e.type === "offer_declined") return { ...row, type: "warning", message: "Declined the help offer" };
  if (e.type === "ai_question") return { ...row, message: "Asked the AI" };
  if (e.type === "handoff_request") return { ...row, type: "warning", message: "Asked for a person" };
  if (category.endsWith("_change")) return { ...row, message: `Changed ${category.replace("_change", "").replace("_", " ")} to ${value}` };
  return row;
}

// handoff:new / handoff:queue item → one queue card
export function toApplicant(h) {
  const share = h.share || {};
  return {
    id: h.session_id.slice(-4),                   // short label for the card
    sessionId: h.session_id,
    pageId: h.page_id,
    handoffNo: h.handoff_no,
    staffName: h.staff_name || null,              // set once someone picks it up
    phone: "",                                    // not collected, by design
    step: share.step_no,
    stepName: share.step_title || h.page_id,
    time: hhmm(h.requested_at),
    status: TRIGGER_LABELS[share.trigger] || "Asked for help",
    detail: share.last_error || null,
    error: share.last_error || null,
    inactivity: mmss(share.time_on_step_s),
    failedAttempts: share.failed_attempts || 0,
    lastInteraction: share.back_count ? `Back used ${share.back_count}×` : "—",
    events: (h.events || []).map(toStreamEvent),  // newest first
  };
}

export default function useHandoffQueue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const onQueue = (list) => setQueue(list.map(toApplicant).reverse());   // newest first
    const onNew = (h) =>
      setQueue((prev) => [toApplicant(h), ...prev.filter((a) => a.sessionId !== h.session_id)]);
    const onTaken = (t) =>
      setQueue((prev) => prev.map((a) => (a.sessionId === t.session_id ? { ...a, staffName: t.staff_name } : a)));
    const onResolved = (r) => setQueue((prev) => prev.filter((a) => a.sessionId !== r.session_id));
    // the user moved on or hit another error while the chat is open: refresh their card
    const onProgress = (h) =>
      setQueue((prev) => prev.map((a) => (a.sessionId === h.session_id ? toApplicant(h) : a)));

    socket.on("handoff:queue", onQueue);
    socket.on("handoff:progress", onProgress);
    socket.on("handoff:new", onNew);
    socket.on("handoff:taken", onTaken);
    socket.on("handoff:resolved", onResolved);
    socket.emit("join_console");                  // ask for the open queue now (also sent on every reconnect)

    return () => {
      socket.off("handoff:queue", onQueue);
      socket.off("handoff:progress", onProgress);
      socket.off("handoff:new", onNew);
      socket.off("handoff:taken", onTaken);
      socket.off("handoff:resolved", onResolved);
    };
  }, []);

  return queue;
}
