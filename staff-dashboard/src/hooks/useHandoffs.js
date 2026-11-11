// Every session that asked for help (live first, then demo data), for the Escalated tab.
// Reloads whenever the server signals a change (insights:update).
import { useEffect, useState } from "react";
import { socket, API_URL } from "../socket";

// 75 → "1m 15s"
export function formatSeconds(s) {
  if (s == null) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d`;
}

const dateTime = (t) =>
  t ? new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// one row of GET /api/handoffs → one case card (field names follow the database)
export function toCase(h, now = Date.now()) {
  const statusLabel =
    h.status === "waiting" ? `Waiting ${formatSeconds(Math.round((now - new Date(h.requested_at)) / 1000))}`
    : h.status === "active" ? `With staff (picked up after ${formatSeconds(h.wait_s)})`
    : `Helped in ${formatSeconds(h.help_s)} (waited ${formatSeconds(h.wait_s)})`;
  const endedLabel =
    h.outcome === "submitted" ? `Submitted ${dateTime(h.ended_at)}`
    : h.outcome === "in_progress" ? `Asked for help ${dateTime(h.requested_at)}`
    : `Ended ${dateTime(h.ended_at || h.requested_at)}`;

  return {
    id: h.session_id.slice(-4),          // short label, same as the Friction Queue
    sessionId: h.session_id,
    source: h.source,                    // "live" or "synthetic" (demo data)
    outcome: h.outcome,                  // in_progress | submitted | not_eligible | abandoned
    status: h.status,                    // waiting | active | resolved (the latest hand-off)
    handoffCount: h.handoff_count,
    pageId: h.page_id,
    step: h.step_no ? `Step ${h.step_no} of 6: ${h.step_title}` : h.step_title,
    error: h.last_error,                 // e.g. "NFC_READ_FAILED", or null
    messageCount: h.message_count,
    requestedAt: h.requested_at,
    acceptedAt: h.accepted_at,
    resolvedAt: h.resolved_at,
    endedAt: h.ended_at,
    waitS: h.wait_s,
    helpS: h.help_s,
    statusLabel,
    endedLabel,
  };
}

export default function useHandoffs(limit = 50) {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    let timer = null;
    let cancelled = false;

    const load = () =>
      fetch(`${API_URL}/api/handoffs?limit=${limit}`)
        .then((res) => res.json())
        .then((rows) => {
          if (!cancelled) {
            const now = Date.now();
            setCases(rows.map((h) => toCase(h, now)));
          }
        })
        .catch(() => {});                 // backend down: keep the last list

    // many events can arrive at once: wait 300 ms, then load once
    const onUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 300);
    };

    load();
    socket.on("insights:update", onUpdate);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      socket.off("insights:update", onUpdate);
    };
  }, [limit]);

  return cases;
}
