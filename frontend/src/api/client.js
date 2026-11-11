const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error ?? data?.message ?? `Request failed: ${res.status}`,
    );
  }

  return data;
}

const TEXT_SIZE_TO_API = {
  default: "default",
  large: "large",
  xlarge: "xlarge",
  larger: "xlarge",
  largest: "xlarge",
};

export function toApiPrefs(p) {
  return {
    wording: p.wording,
    text_size: TEXT_SIZE_TO_API[p.textSize] ?? "default",
    language: p.language,
  };
}

export async function createSession({ preferences }) {
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ preferences }),
  });
}

export async function patchSession(id, changes) {
  return request(`/api/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

// Only true or false about age is sent. Never the date of birth.
export async function checkEligibility({ passport_country, is_18_or_older }) {
  return request("/api/eligibility", {
    method: "POST",
    body: JSON.stringify({ passport_country, is_18_or_older }),
  });
}

// Journey analytics are sent to the backend through Socket.IO. Local listeners
// remain for the adaptive-assistance logic; only the documented event fields
// are sent to the server (detail stays local and is never persisted).
const listeners = new Set();
let socketPromise;
async function getSocket() {
  if (!socketPromise) {
    socketPromise = import("socket.io-client").then(({ io }) =>
      io(BASE, { transports: ["websocket", "polling"] }),
    );
  }
  return socketPromise;
}
export function subscribeEvents(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function logEvent(sessionId, pageId, type, detail = {}) {
  if (!sessionId || !pageId || !type) return;
  if (import.meta.env.DEV)
    console.debug("[event]", { sessionId, pageId, type, detail });
  listeners.forEach((fn) => fn({ sessionId, pageId, type, detail }));
  getSocket()
    .then((socket) => {
      const eventType =
        type === "error"
          ? `error:${detail.code ?? "UNKNOWN"}`
          : type === "friction"
            ? `friction:${detail.trigger ?? "long_pause"}`
            : type;
      const allowed =
        /^(page_view|friction:(long_pause|back_and_forth|repeated_errors)|offer_accepted|offer_declined|language_change:[a-z]{2}|wording_change:(simple|standard)|text_size_change:(default|large|xlarge)|error:[A-Z0-9_]+|journey_complete|journey_abandon)$/.test(
          eventType,
        );
      if (!allowed) return;
      const payload = {
        session_id: sessionId,
        page_id: pageId,
        type: eventType,
      };
      const send = () =>
        socket.emit("event", payload, (ack) => {
          if (!ack?.ok)
            console.error(
              "Journey event was not saved:",
              ack?.error ?? "unknown error",
            );
        });
      if (socket.connected) send();
      else socket.once("connect", send);
    })
    .catch((error) =>
      console.error("Could not connect journey event socket:", error),
    );
}

// One event per preference the customer actually changed, e.g. "wording_change:simple".
const PREF_EVENTS = {
  wording: "wording_change",
  text_size: "text_size_change",
  language: "language_change",
};
export function logPreferenceChanges(sessionId, pageId, before, after) {
  const b = toApiPrefs(before);
  const a = toApiPrefs(after);
  for (const [field, prefix] of Object.entries(PREF_EVENTS)) {
    if (b[field] !== a[field]) logEvent(sessionId, pageId, `${prefix}:${a[field]}`);
  }
}

// ---- Staff hand-off over Socket.IO
// The session's room: joined now and again on every reconnect, so staff
// messages keep arriving after a refresh or a network drop.
let roomSession = null;
let reconnectHooked = false;
export async function joinSessionRoom(sessionId) {
  roomSession = sessionId;
  const socket = await getSocket();
  if (!reconnectHooked) {
    reconnectHooked = true;
    socket.on("connect", () => {
      if (roomSession) socket.emit("join_session", { session_id: roomSession });
    });
  }
  if (sessionId && socket.connected) socket.emit("join_session", { session_id: sessionId });
}

// Send a message and wait for the server's ack ({ ok: true } or { ok: false, error }).
export async function emitWithAck(name, data) {
  const socket = await getSocket();
  return new Promise((resolve) => {
    const send = () =>
      socket.timeout(10000).emit(name, data, (err, ack) =>
        resolve(err ? { ok: false, error: "timeout" } : ack),
      );
    if (socket.connected) send();
    else socket.once("connect", send);
  });
}

// Listen for a server message; returns a function that stops listening.
export function onServerEvent(name, fn) {
  let stopped = false;
  let off = () => {};
  getSocket().then((socket) => {
    if (stopped) return;
    socket.on(name, fn);
    off = () => socket.off(name, fn);
  });
  return () => {
    stopped = true;
    off();
  };
}

export async function submitApplication(sessionId) {
  return request("/api/applications", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function explainQuestion({ session_id, page_id, question }) {
  return request("/api/explain", {
    method: "POST",
    body: JSON.stringify({
      session_id,
      page_id,
      question,
    }),
  });
}
