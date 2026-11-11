import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const KEY = "ocbcsense.prefs";

export const DEFAULTS = {
  textSize: "default",
  language: "en",
  wording: "standard",
  readAloud: false,
  layout: "standard",
};

function load() {
  const base = { ...DEFAULTS, setupDone: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      delete saved.skipped;
      delete saved.uiMode; // retired preference
      if (saved.wording !== "simple") saved.wording = "standard";
      if (saved.layout !== "guided") saved.layout = "standard";
      return { ...base, ...saved };
    }
  } catch {
    /* storage unavailable: use defaults */
  }
  return base;
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = prefs.textSize;
    root.dataset.layout = prefs.layout;
    root.dataset.wording = prefs.wording;
    root.lang = prefs.language === "zh" ? "zh-Hans" : prefs.language;
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const update = useCallback(
    (changes) => setPrefs((p) => ({ ...p, ...changes })),
    [],
  );

  // Start setup from the plain defaults. Language stays as the customer chose it.
  const startSetup = useCallback(
    () =>
      setPrefs((p) => ({
        ...DEFAULTS,
        language: p.language,
        setupDone: false,
      })),
    [],
  );
  const finishSetup = useCallback(
    () => setPrefs((p) => ({ ...p, setupDone: true })),
    [],
  );

  return (
    <PreferencesContext.Provider
      value={{ prefs, update, startSetup, finishSetup }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
