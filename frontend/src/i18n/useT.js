import { useCallback } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { translate, translateWording } from "./index";

// const { t, tw, lang, wording } = useT()
// t('welcome.title')   -> the text in the language chosen in Settings
// tw('s3.wait')        -> the same, in the Simple or Standard wording the customer chose
//                         (uses "<key>.simple" when it exists, otherwise the normal text)
export default function useT() {
  const { prefs } = usePreferences();
  const lang = prefs.language;
  const wording = prefs.wording === "simple" ? "simple" : "standard";
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const tw = useCallback(
    (key, vars) => translateWording(lang, wording, key, vars),
    [lang, wording],
  );
  return { t, tw, lang, wording };
}
