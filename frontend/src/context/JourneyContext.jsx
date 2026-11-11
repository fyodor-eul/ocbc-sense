import { createContext, useCallback, useContext, useState } from "react";
import { createSession, patchSession, toApiPrefs } from "../api/client";

const KEY = "ocbcsense.session";
const REF_KEY = "ocbcsense.reference";
const EMPTY_APPLICANT = { country: "", dob: "" };
const EMPTY_CHECKLIST = { passport: false, nationalId: false, phone: false };
const EMPTY_DONE = { nfc: false, id: false, face: false, doc: false };
const EMPTY_ATTEMPTS = { nfc: 0, id: 0, face: 0, doc: 0 };
const EMPTY_CONTACT = { dial: "+852", mobile: "", email: "" };

function read(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const JourneyContext = createContext(null);

export function JourneyProvider({ children }) {
  // Only the session ID and the finished reference are kept in the browser.
  // Country, date of birth, contact details and documents live in memory only.
  const [sessionId, setSessionId] = useState(() => read(KEY));
  const [reference, setReference] = useState(() => read(REF_KEY));
  const [startedAt, setStartedAt] = useState(null);
  const [applicant, setApplicant] = useState(EMPTY_APPLICANT);
  const [eligibility, setEligibility] = useState(null);
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [done, setDone] = useState(EMPTY_DONE);
  const [attempts, setAttempts] = useState(EMPTY_ATTEMPTS);
  const [documentType, setDocumentType] = useState("");
  const [contact, setContact] = useState(EMPTY_CONTACT);

  const clearAnswers = useCallback(() => {
    setApplicant(EMPTY_APPLICANT);
    setEligibility(null);
    setChecklist(EMPTY_CHECKLIST);
    setDone(EMPTY_DONE);
    setAttempts(EMPTY_ATTEMPTS);
    setDocumentType("");
    setContact(EMPTY_CONTACT);
  }, []);

  const reset = useCallback(() => {
    write(KEY, null);
    write(REF_KEY, null);
    setSessionId(null);
    setReference(null);
    setStartedAt(null);
    clearAnswers();
  }, [clearAnswers]);

  const completeJourney = useCallback((ref) => {
    write(REF_KEY, ref);
    setReference(ref);

    // Keep the completed session alive until the confirmation flow is finished.
    // The session can be cleared when the user starts/leaves the next journey.
  }, []);

  const startJourney = useCallback(
    async (prefs) => {
      if (sessionId) return sessionId;
      const { session_id } = await createSession({
        preferences: toApiPrefs(prefs),
      });
      write(KEY, session_id);
      setSessionId(session_id);
      setStartedAt(Date.now());
      return session_id;
    },
    [sessionId],
  );

  // Leaving must never fail, so errors are ignored here.
  const endJourney = useCallback(
    async (outcome) => {
      try {
        if (sessionId) await patchSession(sessionId, { outcome });
      } catch {
        /* ignore */
      }
      reset();
    },
    [sessionId, reset],
  );

  const durationSeconds = useCallback(
    () => (startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0),
    [startedAt],
  );

  const clearEligibility = useCallback(() => setEligibility(null), []);
  const toggleChecklist = useCallback(
    (key) => setChecklist((c) => ({ ...c, [key]: !c[key] })),
    [],
  );
  const markDone = useCallback(
    (key, value = true) => setDone((d) => ({ ...d, [key]: value })),
    [],
  );
  const recordAttempt = useCallback(
    (key) => setAttempts((a) => ({ ...a, [key]: a[key] + 1 })),
    [],
  );

  return (
    <JourneyContext.Provider
      value={{
        sessionId,
        reference,
        applicant,
        saveApplicant: setApplicant,
        eligibility,
        setEligibility,
        clearEligibility,
        checklist,
        toggleChecklist,
        done,
        markDone,
        attempts,
        recordAttempt,
        documentType,
        setDocumentType,
        contact,
        saveContact: setContact,
        startJourney,
        endJourney,
        completeJourney,
        durationSeconds,
        reset,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  return useContext(JourneyContext);
}
