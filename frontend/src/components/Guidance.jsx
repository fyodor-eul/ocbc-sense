import { Lightbulb, Volume2 } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";
import { speak } from "../utils/speech";
import useT from "../i18n/useT";
import "./Guidance.css";

export default function Guidance({ message }) {
  const { prefs } = usePreferences();
  const { t } = useT();

  const shouldShow = Boolean(message) && prefs.layout === "guided";

  if (!shouldShow) {
    return null;
  }

  function handleListen() {
    speak(message, prefs.language);
  }

  return (
    <section className="guidance" aria-live="polite">
      <div className="guidance__content">
        <Lightbulb className="guidance__icon" size={20} aria-hidden="true" />

        <div>
          <p className="guidance__label">{t("guidance.next")}</p>

          <p className="guidance__message">{message}</p>
        </div>
      </div>

      {prefs.readAloud && (
        <button
          type="button"
          className="guidance__listen"
          onClick={handleListen}
        >
          <Volume2 size={17} aria-hidden="true" />
          {t("guidance.listen")}
        </button>
      )}
    </section>
  );
}
