import { Volume2, Square } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";
import { speak, stopSpeaking } from "../utils/speech";
import useT from "../i18n/useT";
import "./PageReadAloud.css";

export default function PageReadAloud({ text }) {
  const { prefs } = usePreferences();
  const { t } = useT();

  if (!prefs.readAloud || !text) {
    return null;
  }

  function handleRead() {
    speak(text, prefs.language);
  }

  function handleStop() {
    stopSpeaking();
  }

  return (
    <div className="page-read-aloud">
      <button
        type="button"
        className="page-read-aloud__button"
        onClick={handleRead}
      >
        <Volume2 size={18} aria-hidden="true" />
        {t("audio.listen")}
      </button>

      <button
        type="button"
        className="page-read-aloud__stop"
        onClick={handleStop}
        aria-label={t("audio.stop")}
      >
        <Square size={16} aria-hidden="true" />
        {t("audio.stop")}
      </button>
    </div>
  );
}
