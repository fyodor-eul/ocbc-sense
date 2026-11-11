// One applicant's chat: earlier messages from the server, new ones live, plus send and resolve.
import { useCallback, useEffect, useState } from "react";
import { socket, API_URL } from "../socket";

const hhmm = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const toItem = (m) => ({ sender: m.sender, staffName: m.staff_name, text: m.text, time: hhmm(m.time) });

export default function useChat(sessionId) {
  // remember which session the messages belong to, so switching applicants never shows the wrong chat
  const [chat, setChat] = useState({ sessionId: null, messages: [] });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    // earlier messages (also after a page refresh)
    fetch(`${API_URL}/api/sessions/${sessionId}/messages`)
      .then((res) => res.json())
      .then((list) => { if (!cancelled) setChat({ sessionId, messages: list.map(toItem) }); });

    // new messages, from staff or the applicant
    const onMessage = (m) => {
      if (m.session_id !== sessionId) return;
      setChat((prev) => ({ sessionId, messages: [...(prev.sessionId === sessionId ? prev.messages : []), toItem(m)] }));
    };
    socket.on("handoff:message", onMessage);
    socket.on("handoff:reply", onMessage);

    return () => {
      cancelled = true;
      socket.off("handoff:message", onMessage);
      socket.off("handoff:reply", onMessage);
    };
  }, [sessionId]);

  // each returns the server's answer, e.g. { ok: true } or { ok: false, error: "not_picked_up" }
  const send = useCallback(
    (text) => new Promise((resolve) => socket.emit("handoff:message", { session_id: sessionId, text }, resolve)),
    [sessionId]);
  const resolve = useCallback(
    () => new Promise((done) => socket.emit("handoff:resolved", { session_id: sessionId }, done)),
    [sessionId]);

  return { messages: chat.sessionId === sessionId ? chat.messages : [], send, resolve };
}
