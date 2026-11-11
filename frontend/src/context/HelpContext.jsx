import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import Dialog from "../components/Dialog";
import { useJourney } from "./JourneyContext";
import { usePreferences } from "./PreferencesContext";
import { usePresenter } from "./PresenterContext";
import {
  emitWithAck,
  explainQuestion,
  joinSessionRoom,
  logEvent,
  logPreferenceChanges,
  onServerEvent,
  patchSession,
  subscribeEvents,
  toApiPrefs,
} from "../api/client";
import { getPage } from "../data/content";
import { translate } from "../i18n";
import { speak } from "../utils/speech";
import MenuSheet from "../assistance/MenuSheet";
import ChatSheet from "../assistance/ChatSheet";
import ConsentSheet from "../assistance/ConsentSheet";
import StaffSheet from "../assistance/StaffSheet";
import StaffStatusBar from "../assistance/StaffStatusBar";
import "../assistance/assistance.css";

/*
  Assistance timing:

  0–3 minutes:
  - Normal page
  - AskSense is always available

  After 3 minutes of inactivity:
  - Show guidance / tip level

  After 6 minutes of inactivity:
  - Escalate AskSense / AI assistance level

  Friction triggers:
  - repeated errors
  - back and forth navigation

  These escalate directly to level 2.poke
*/

const REAL = {
  tip: 180_000,
  glow: 360_000,
};

const DEMO = {
  tip: 10_000,
  glow: 20_000,
};

const HelpContext = createContext({
  openHelp: () => {},
  openChat: () => {},
  openStaff: () => {},
  level: 0,
  helpOpen: false,
  pageId: null,
});

function pageIdFor(pathname) {
  const m = pathname.match(/^\/step\/(\d)$/);

  if (m) {
    return `account.step${m[1]}`;
  }

  if (["/submitted", "/next", "/home"].includes(pathname)) {
    return "account.submitted";
  }

  return null;
}

const stepOf = (id) =>
  id?.startsWith("account.step") ? Number(id.slice(-1)) : null;

const clock = () =>
  new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

let uid = 0;

const nextId = (prefix) => `${prefix}${(uid += 1)}`;

export function HelpProvider({ children }) {
  const { pathname } = useLocation();

  const { sessionId } = useJourney();

  const { prefs, update: updatePrefs } = usePreferences();

  const { enabled: demo, scenarios } = usePresenter();

  const T = DEMO;

  const pageId = pageIdFor(pathname);

  const step = stepOf(pageId);

  const page = pageId ? getPage(pageId) : null;

  /*
    sheet:
    null
    menu
    chat
    consent
    staff
  */
  const [sheet, setSheet] = useState(null);

  /*
    Assistance levels:

    0 = normal
    1 = 3-minute guidance
    2 = 6-minute proactive AskSense / AI assistance
  */
  const [level, setLevel] = useState(0);

  const [messages, setMessages] = useState([]);

  const [asking, setAsking] = useState(false);

  const [staff, setStaff] = useState({
    status: "idle",
    position: 0,
    messages: [],
    unread: false,
  });

  /*
    Latest values for timers and event listeners.
  */
  const live = useRef({});

  live.current = {
    pageId,
    step,
    sessionId,
    sheet,
    staffStatus: staff.status,
    prefs,
    scenarios,
  };

  /*
    Per-page / journey tracking.
  */
  const usedTip = useRef(false);

  const usedChat = useRef(false);

  const errors = useRef({
    count: 0,
    last: 0,
    code: null,
  });

  const lastErrorByPage = useRef({});

  const backs = useRef({});

  const prevStep = useRef(null);

  const stopStaff = useRef(null);

  const handoffId = useRef(null);

  const requestedAt = useRef(0);

  const acceptedAt = useRef(0);

  const log = useCallback((type, detail = {}, id) => {
    const { sessionId: currentSessionId, pageId: currentPageId } = live.current;

    if (currentSessionId) {
      logEvent(currentSessionId, id ?? currentPageId, type, detail);
    }
  }, []);

  const staffActive = staff.status === "waiting" || staff.status === "joined";

  /*
    ----------------------------------------
    NEW PAGE
    ----------------------------------------

    Reset page-specific assistance state.
  */
  useEffect(() => {
    setLevel(0);

    setMessages([]);

    errors.current = {
      count: 0,
      last: 0,
      code: null,
    };

    const current = live.current;

    const from = prevStep.current;

    /*
      Detect repeated back-and-forth navigation.

      If the user goes backwards to the same step twice,
      escalate directly to proactive assistance.
    */
    if (current.sessionId && step && from && from > step) {
      logEvent(current.sessionId, `account.step${from}`, "back");

      backs.current[step] = (backs.current[step] ?? 0) + 1;

      if (backs.current[step] === 2) {
        logEvent(current.sessionId, current.pageId, "friction", {
          trigger: "back_and_forth",
        });

        /*
          Escalate AskSense directly.

          No separate OfferCard is shown.
        */
        setLevel(2);
      }
    }

    prevStep.current = step;
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  /*
    ----------------------------------------
    PERSIST PREFERENCES
    ----------------------------------------

    Save preference changes during an active journey.
  */
  const previousPrefs = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      previousPrefs.current = prefs;
      return;
    }

    if (previousPrefs.current === null) {
      previousPrefs.current = prefs;
      return;
    }

    if (JSON.stringify(previousPrefs.current) === JSON.stringify(prefs)) {
      return;
    }

    previousPrefs.current = prefs;

    patchSession(sessionId, {
      current_preferences: toApiPrefs(prefs),
    }).catch((error) => {
      console.error("Could not save preferences:", error);
    });
  }, [sessionId, prefs]);

  /*
    ----------------------------------------
    NEW JOURNEY
    ----------------------------------------

    Reset journey-specific tracking.
  */
  useEffect(() => {
    backs.current = {};

    lastErrorByPage.current = {};

    usedTip.current = false;

    usedChat.current = false;

    prevStep.current = null;
  }, [sessionId]);

  /*
    ----------------------------------------
    REPEATED ERRORS
    ----------------------------------------

    If the same page produces repeated errors,
    escalate to level 2 AskSense assistance.
  */
  useEffect(
    () =>
      subscribeEvents((event) => {
        if (event.type !== "error") {
          return;
        }

        lastErrorByPage.current[event.pageId] = event.detail?.code ?? null;

        if (event.pageId !== live.current.pageId) {
          return;
        }

        const now = Date.now();

        /*
          Multiple validation errors caused by
          one button click count as one event.
        */
        if (now - errors.current.last < 600) {
          return;
        }

        errors.current.last = now;

        errors.current.count += 1;

        if (errors.current.count === 2) {
          logEvent(event.sessionId, event.pageId, "friction", {
            trigger: "repeated_errors",
          });

          /*
            Escalate directly to proactive AskSense.

            No OfferCard.
          */
          setLevel(2);
        }
      }),
    [],
  );

  /*
    ----------------------------------------
    IDLE TIMERS
    ----------------------------------------

    After 3 minutes:
    Level 1 → guidance

    After 6 minutes:
    Level 2 → proactive AskSense / AI button
  */
  useEffect(() => {
    if (!sessionId || !step || sheet) {
      return undefined;
    }

    let tipTimer;

    let glowTimer;

    const arm = () => {
      clearTimeout(tipTimer);

      clearTimeout(glowTimer);

      /*
        3 minutes
        Show guidance.
      */
      tipTimer = setTimeout(() => {
        log("friction", {
          trigger: "long_pause_3min",
        });

        setLevel((currentLevel) => Math.max(currentLevel, 1));
      }, T.tip);

      /*
        6 minutes
        Escalate to proactive AskSense / AI help.
      */
      glowTimer = setTimeout(() => {
        log("friction", {
          trigger: "long_pause_6min",
        });

        setLevel(2);

        setSheet((currentSheet) => {
          if (currentSheet === null) {
            return "menu";
          }

          return currentSheet;
        });
      }, T.glow);
    };

    const poke = () => {
      arm();
    };

    const events = ["pointerdown", "keydown", "input", "touchstart"];

    events.forEach((eventName) => {
      window.addEventListener(eventName, poke, true);
    });

    arm();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, poke, true);
      });

      clearTimeout(tipTimer);

      clearTimeout(glowTimer);
    };
  }, [sessionId, step, pageId, sheet, T.tip, T.glow, log]);

  /*
    Log the first time guidance is used.
  */
  useEffect(() => {
    if (level >= 1) {
      usedTip.current = true;
    }
  }, [level]);

  /*
    ----------------------------------------
    SHEETS
    ----------------------------------------
  */

  const closeSheet = useCallback(() => {
    setSheet(null);

    setStaff((currentStaff) =>
      currentStaff.unread
        ? {
            ...currentStaff,
            unread: false,
          }
        : currentStaff,
    );
  }, []);

  const openHelp = useCallback(() => {
    setSheet(live.current.staffStatus === "idle" ? "menu" : "staff");
  }, []);

  const openChat = useCallback(() => {
    setSheet("chat");
  }, []);

  const openStaff = useCallback(() => {
    setSheet(
      live.current.staffStatus === "idle" ||
        live.current.staffStatus === "resolved"
        ? "consent"
        : "staff",
    );
  }, []);

  /*
    ----------------------------------------
    AI ASSISTANT CHAT
    ----------------------------------------
  */

  const ask = useCallback(
    async (text) => {
      const question = text.trim().slice(0, 300);

      const current = live.current;

      if (!question || asking || !current.pageId || !current.sessionId) {
        return;
      }

      usedChat.current = true;

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextId("m"),
          from: "user",
          text: question,
          time: clock(),
        },
      ]);

      setAsking(true);

      try {
        const response = await explainQuestion({
          session_id: current.sessionId,
          page_id: current.pageId,
          question,
        });

        if (current.pageId !== live.current.pageId) {
          return;
        }

        const fallback = response.fallback || !response.answer;

        const answer = fallback
          ? response.answer || translate(current.prefs.language, "chat.fallback.staff")
          : response.answer;

        // The AI suggests a setting change: ask first, apply only on Yes.
        const suggestion =
          response.type === "preference_change" && response.action
            ? { action: response.action, value: response.value, decided: null }
            : null;

        if (current.prefs.readAloud) {
          speak(answer, current.prefs.language);
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: nextId("m"),
            from: "bot",
            text: answer,
            time: clock(),
            fallback,
            suggestion,
            feedback: suggestion ? "suggestion" : null,
          },
        ]);
      } catch {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: nextId("m"),
            from: "bot",
            text: "I’m having trouble connecting right now. Please try again or contact customer service.",
            time: clock(),
            fallback: true,
            feedback: null,
          },
        ]);
      } finally {
        setAsking(false);
      }
    },
    [asking],
  );

  /*
    The customer answers the AI's "Would you like…?" suggestion.
    Only a Yes changes anything; the server gets the new preferences
    (saved by the preferences effect) and one change event.
  */
  const SUGGESTION_TO_PREFS = {
    increase_text_size: (value) => ({ textSize: value }),
    decrease_text_size: (value) => ({ textSize: value }),
    change_language: (value) => ({ language: value }),
    simplify_language: () => ({ wording: "simple" }),
    read_aloud: () => ({ readAloud: true }),
  };

  const decide = (id, yes) => {
    const current = live.current;
    const message = messages.find((m) => m.id === id);
    const toPrefs = message?.suggestion && SUGGESTION_TO_PREFS[message.suggestion.action];

    if (yes && toPrefs) {
      const changes = toPrefs(message.suggestion.value);
      if (current.sessionId && current.pageId) {
        logPreferenceChanges(current.sessionId, current.pageId, current.prefs, {
          ...current.prefs,
          ...changes,
        });
      }
      updatePrefs(changes);
    }

    setMessages((currentMessages) =>
      currentMessages.map((m) =>
        m.id === id
          ? { ...m, suggestion: { ...m.suggestion, decided: yes ? "yes" : "no" } }
          : m,
      ),
    );
  };

  /*
    ----------------------------------------
    AI RESPONSE RATING
    ----------------------------------------
  */

  const rate = (id, outcome) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === id
          ? {
              ...message,
              feedback: outcome,
            }
          : message,
      ),
    );

    log("ai_question", {
      outcome,
    });

    if (
      outcome === "not_helped" &&
      live.current.sessionId &&
      live.current.step
    ) {
      openStaff();
    }
  };

  /*
    ----------------------------------------
    STAFF HELP
    ----------------------------------------

    Existing staff texting simulation is preserved.
  */

  const share = useMemo(() => {
    const code = lastErrorByPage.current[pageId] ?? null;

    return {
      step_no: step,

      step_title: page?.title ?? "",

      preferences: {
        wording: prefs.wording,
        text_size: prefs.textSize,
        voice: prefs.readAloud ? "read_aloud" : "off",
        language: prefs.language,
      },

      offers: usedChat.current ? ["ai"] : [],

      tried: {
        tip: usedTip.current,
        chat: usedChat.current,
      },

      last_error: code,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, pageId, step, page, prefs]);

  const sendRequest = async () => {
    const current = live.current;

    handoffId.current = nextId("h");

    requestedAt.current = Date.now();

    // local listeners only (the server records hand-off events itself)
    logEvent(current.sessionId, current.pageId, "handoff_request", {
      handoff_id: handoffId.current,
    });

    setStaff({
      status: "waiting",
      position: 1,
      messages: [],
      unread: false,
    });

    setSheet("staff");

    /*
      Real hand-off: the request goes to every staff dashboard.
      Only what the consent screen showed is shared.
    */
    const failed = errors.current.count;
    const res = await emitWithAck("handoff:request", {
      session_id: current.sessionId,
      page_id: current.pageId,
      share: failed ? { ...share, failed_attempts: failed } : share,
    });

    if (!res?.ok && res?.error !== "already_open") {
      setStaff((currentStaff) => ({ ...currentStaff, status: "failed" }));
    }
  };

  // The customer's reply to staff; it appears in the chat when the server echoes it back.
  const replyStaff = async (text) => {
    const res = await emitWithAck("handoff:reply", {
      session_id: live.current.sessionId,
      text,
    });
    return res?.ok === true;
  };

  /*
    Messages from the server for this customer's session room.
  */
  useEffect(() => {
    const mine = (d) => d?.session_id && d.session_id === live.current.sessionId;

    const toMessage = (m) => ({
      id: nextId("s"),
      from: m.sender === "staff" ? "staff" : "user",
      text: m.text,
      time: new Date(m.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });

    const stops = [
      onServerEvent("handoff:accepted", (d) => {
        if (!mine(d)) return;

        acceptedAt.current = Date.now();

        logEvent(live.current.sessionId, live.current.pageId, "handoff_accepted", {
          handoff_id: handoffId.current,
          wait_s: Math.round((Date.now() - requestedAt.current) / 1000),
        });

        setStaff((currentStaff) => ({
          ...currentStaff,
          status: "joined",
          staffName: d.staff_name,
          unread: live.current.sheet !== "staff",
        }));
      }),

      onServerEvent("handoff:message", (m) => {
        if (!mine(m)) return;

        if (live.current.prefs.readAloud) {
          speak(m.text, live.current.prefs.language);
        }

        setStaff((currentStaff) => ({
          ...currentStaff,
          messages: [...currentStaff.messages, toMessage(m)],
          unread: live.current.sheet !== "staff",
        }));
      }),

      onServerEvent("handoff:reply", (m) => {
        if (!mine(m)) return;

        setStaff((currentStaff) => ({
          ...currentStaff,
          messages: [...currentStaff.messages, toMessage(m)],
        }));
      }),

      // after a refresh or reconnect: the chat so far
      onServerEvent("handoff:history", (h) => {
        if (!mine(h)) return;

        setStaff((currentStaff) => ({
          ...currentStaff,
          status: h.staff_name ? "joined" : "waiting",
          position: 1,
          staffName: h.staff_name,
          messages: h.messages.map(toMessage),
        }));
      }),

      onServerEvent("handoff:resolved", (d) => {
        if (!mine(d)) return;

        logEvent(live.current.sessionId, live.current.pageId, "handoff_resolved", {
          handoff_id: handoffId.current,
          resolve_s: Math.round((Date.now() - acceptedAt.current) / 1000),
        });

        setStaff((currentStaff) => ({
          ...currentStaff,
          status: "resolved",
          unread: live.current.sheet !== "staff",
        }));
      }),
    ];

    return () => stops.forEach((stop) => stop());
  }, []);

  // Join this session's room as soon as there is a session (and on every reconnect).
  useEffect(() => {
    if (sessionId) joinSessionRoom(sessionId);
  }, [sessionId]);

  const endStaff = () => {
    stopStaff.current?.();

    stopStaff.current = null;

    setStaff({
      status: "idle",
      position: 0,
      messages: [],
      unread: false,
    });

    setSheet(null);
  };

  useEffect(() => () => stopStaff.current?.(), []);

  /*
    Leaving the journey ends any open request.
  */
  useEffect(() => {
    if (!sessionId && stopStaff.current) {
      endStaff();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  /*
    Expose the assistance level so the AskSense
    button can visually respond:

    level 0 → normal
    level 1 → guidance shown
    level 2 → proactive AI / AskSense emphasis
  */
  const value = useMemo(
    () => ({
      openHelp,
      openChat,
      openStaff,
      level,
      helpOpen: sheet !== null,
      pageId,
    }),
    [openHelp, openChat, openStaff, level, sheet, pageId],
  );

  const titles = {
    menu: "How can we help?",
    chat: "Assistant",
    consent: "Share a summary with our team?",
    staff: "Staff help",
  };

  return (
    <HelpContext.Provider value={value}>
      {children}

      {staffActive || staff.status === "resolved"
        ? sheet !== "staff" && (
            <StaffStatusBar
              staff={staff}
              onOpen={() => {
                setSheet("staff");

                setStaff((currentStaff) => ({
                  ...currentStaff,
                  unread: false,
                }));
              }}
            />
          )
        : null}

      <Dialog
        open={sheet !== null}
        onClose={closeSheet}
        title={titles[sheet] ?? ""}
        className={sheet === "chat" || sheet === "staff" ? "dialog--tall" : ""}
      >
        {sheet === "menu" && (
          <MenuSheet
            canStaff={!!sessionId && !!step}
            onChat={openChat}
            onStaff={openStaff}
            onClose={closeSheet}
          />
        )}

        {sheet === "chat" && (
          <ChatSheet
            title={page?.title}
            pageId={pageId}
            messages={messages}
            asking={asking}
            canStaff={!!sessionId && !!step}
            onAsk={ask}
            onRate={rate}
            onDecide={decide}
            onStaff={openStaff}
          />
        )}

        {sheet === "consent" && (
          <ConsentSheet
            share={share}
            onShare={sendRequest}
            onBack={() => setSheet("menu")}
          />
        )}

        {sheet === "staff" && (
          <StaffSheet staff={staff} onReply={replyStaff} onCancel={endStaff} onClose={closeSheet} />
        )}
      </Dialog>
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}
