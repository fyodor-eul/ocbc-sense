import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import Screen from "../components/Screen";
import Header from "../components/Header";
import OptionCard from "../components/OptionCard";
import Toggle from "../components/Toggle";
import Button from "../components/Button";
import Guidance from "../components/Guidance";
import PageReadAloud from "../components/PageReadAloud";
import { usePreferences } from "../context/PreferencesContext";
import { useJourney } from "../context/JourneyContext";
import { getLastPage } from "../hooks/usePageView";
import { LANGUAGE_OPTIONS, TEXT_SIZES } from "../data/options";
import { logPreferenceChanges, patchSession, toApiPrefs } from "../api/client";
import { canSpeak, speak } from "../utils/speech";
import useT from "../i18n/useT";
import "./Prefs.css";

// Which field of the API preferences each setting maps to.
const API_FIELD = {
  language: "language",
  wording: "wording",
  textSize: "text_size",
  readAloud: "voice",
};

// Every change applies straight away and is saved on this device (see PreferencesContext).
export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, tw } = useT();
  const { prefs, update } = usePreferences();
  const { sessionId } = useJourney();
  const [voiceMessage, setVoiceMessage] = useState("");

  function change(field, value) {
    if (prefs[field] === value) return;
    update({ [field]: value });

    // During an application, tell the server what changed (e.g. wording_change:simple + current preferences).
    const apiField = API_FIELD[field];
    if (!sessionId || !apiField) return;
    const next = { ...prefs, [field]: value };
    const page = getLastPage();
    if (page) logPreferenceChanges(sessionId, page, prefs, next);
    patchSession(sessionId, { current_preferences: toApiPrefs(next) }).catch(() => {});
  }

  function hearSample() {
    const ok = speak(t("prefs.sample"), prefs.language);
    setVoiceMessage(ok ? "" : t("read.unavailable"));
  }

  // Go back to where the customer came from. If Settings was opened directly, go to the start.
  function done() {
    if (location.key === "default") navigate("/welcome");
    else navigate(-1);
  }

  return (
    <Screen
      header={<Header onBack={done} />}
      footer={<Button onClick={done}>{t("settings.done")}</Button>}
    >
      <h1 className="prefs__title">{t("settings.title")}</h1>
      <PageReadAloud
        text={[
          t("settings.title"),
          t("settings.intro"),
          tw("settings.guidance.preferences"),
        ].filter(Boolean).join(". ")}
      />
      <p className="prefs__intro">{t("settings.intro")}</p>
      <Guidance message={tw("settings.guidance.preferences")} />

      <section className="prefs__section" aria-labelledby="set-lang">
        <h2 id="set-lang" className="prefs__heading">
          {t("prefs.lang.title")}
        </h2>
        {LANGUAGE_OPTIONS.map((l) => (
          <OptionCard
            key={l.id}
            selected={prefs.language === l.id}
            onSelect={() => change("language", l.id)}
          >
            <span className="lang-row">
              <span className="lang-badge" aria-hidden="true">
                {l.badge}
              </span>
              <span className="lang-text">
                <span className="option__title">{t(`lang.${l.id}.name`)}</span>
                <span className="option__note">{t(`lang.${l.id}.note`)}</span>
              </span>
            </span>
          </OptionCard>
        ))}
      </section>

      <section className="prefs__section" aria-labelledby="set-size">
        <h2 id="set-size" className="prefs__heading">
          {t("prefs.size.title")}
        </h2>
        <div className="prefs__grid">
          {TEXT_SIZES.map((s) => (
            <OptionCard
              key={s.id}
              selected={prefs.textSize === s.id}
              onSelect={() => change("textSize", s.id)}
            >
              <span className="aa" style={{ fontSize: s.aa }}>
                Aa
              </span>
              <span className="option__title">{t(`size.${s.id}`)}</span>
              <span className="option__note">{t(`size.${s.id}.note`)}</span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="prefs__section" aria-labelledby="set-wording">
        <h2 id="set-wording" className="prefs__heading">
          {t("wording.title")}
        </h2>
        <div className="prefs__grid">
          <OptionCard
            tone="blue"
            selected={prefs.wording === "simple"}
            onSelect={() => change("wording", "simple")}
          >
            <span className="option__title">{t("wording.simple")}</span>
            <span className="option__note">{t("wording.simple.note")}</span>
            <span className="example">{t("wording.simple.example")}</span>
          </OptionCard>
          <OptionCard
            tone="blue"
            selected={prefs.wording === "standard"}
            onSelect={() => change("wording", "standard")}
          >
            <span className="option__title">{t("wording.standard")}</span>
            <span className="option__note">{t("wording.standard.note")}</span>
            <span className="example">{t("wording.standard.example")}</span>
          </OptionCard>
        </div>
      </section>

      <section className="prefs__section" aria-labelledby="set-read">
        <h2 id="set-read" className="prefs__heading">
          {t("read.title")}
        </h2>
        <div className="row-card">
          <div className="row-card__line">
            <span>
              <span className="row-card__label">{t("read.label")}</span>
              <br />
              <span className="row-card__note">{t("read.note")}</span>
            </span>
            <Toggle
              label={t("read.label")}
              checked={prefs.readAloud}
              onChange={(value) => change("readAloud", value)}
            />
          </div>
          <div className="row-card__voice">
            <Button
              variant="secondary"
              fullWidth={false}
              onClick={hearSample}
              disabled={!canSpeak()}
            >
              <Volume2 size={18} aria-hidden="true" /> {t("read.hear")}
            </Button>
            <span className="row-card__note">{t("read.voice")}</span>
          </div>
          {(voiceMessage || !canSpeak()) && (
            <p className="row-card__hint" role="status">
              {voiceMessage || t("read.unavailable")}
            </p>
          )}
        </div>
      </section>

      <section className="prefs__section" aria-labelledby="set-layout">
        <h2 id="set-layout" className="prefs__heading">
          {t("layout.title")}
        </h2>
        <OptionCard
          selected={prefs.layout === "standard"}
          onSelect={() => change("layout", "standard")}
        >
          <span className="layout-row">
            <span className="thumb" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              <span className="option__title">{t("layout.standard")}</span>
              <br />
              <span className="option__note">{t("layout.standard.note")}</span>
            </span>
          </span>
        </OptionCard>
        <OptionCard
          tone="blue"
          selected={prefs.layout === "guided"}
          onSelect={() => change("layout", "guided")}
        >
          <span className="layout-row">
            <span className="thumb thumb--guided" aria-hidden="true">
              <i />
              <i />
              <b />
            </span>
            <span>
              <span className="option__title">{t("layout.guided")}</span>
              <br />
              <span className="option__note">{t("layout.guided.note")}</span>
            </span>
          </span>
        </OptionCard>
      </section>
    </Screen>
  );
}
