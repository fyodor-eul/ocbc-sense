import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import Screen from "../components/Screen";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import OptionCard from "../components/OptionCard";
import Toggle from "../components/Toggle";
import Button from "../components/Button";
import Guidance from "../components/Guidance";
import { usePreferences } from "../context/PreferencesContext";
import { canSpeak, speak } from "../utils/speech";
import useT from "../i18n/useT";
import PageReadAloud from "../components/PageReadAloud";
import "./Prefs.css";

export default function PrefsWording() {
  const navigate = useNavigate();
  const { t, tw } = useT();
  const { prefs, update, finishSetup } = usePreferences();
  const [voiceMessage, setVoiceMessage] = useState("");

  function hearSample() {
    const ok = speak(t("prefs.sample"), prefs.language);
    setVoiceMessage(ok ? "" : t("read.unavailable"));
  }

  function save() {
    finishSetup();
    navigate("/preferences/saved");
  }

  return (
    <Screen header={<Header onBack={() => navigate("/preferences/1")} />}>
      <ProgressBar
        current={2}
        total={2}
        label={t("prefs.progress", { n: 2, total: 2 })}
      />
      <h1 className="prefs__title">{t("prefs2.title")}</h1>
      <PageReadAloud
        text={[
          t("prefs2.title"),
          t("prefs2.intro"),
          t("wording.title"),
          t("read.title"),
          t("layout.title"),
        ].filter(Boolean).join(". ")}
      />
      <p className="prefs__intro">{t("prefs2.intro")}</p>

      <section className="prefs__section" aria-labelledby="wording-h">
        <h2 id="wording-h" className="prefs__heading">
          {t("wording.title")}
        </h2>
        <div className="prefs__grid">
          <OptionCard
            selected={prefs.wording === "simple"}
            onSelect={() => update({ wording: "simple" })}
          >
            <span className="option__title">{t("wording.simple")}</span>
            <span className="option__note">{t("wording.simple.note")}</span>
            <span className="example">{t("wording.simple.example")}</span>
          </OptionCard>
          <OptionCard
            selected={prefs.wording === "standard"}
            onSelect={() => update({ wording: "standard" })}
          >
            <span className="option__title">{t("wording.standard")}</span>
            <span className="option__note">{t("wording.standard.note")}</span>
            <span className="example">{t("wording.standard.example")}</span>
          </OptionCard>
        </div>
      </section>

      <section className="prefs__section" aria-labelledby="read-h">
        <h2 id="read-h" className="prefs__heading">
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
              onChange={(readAloud) => update({ readAloud })}
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
          </div>
          {(voiceMessage || !canSpeak()) && (
            <p className="row-card__hint" role="status">
              {voiceMessage || t("read.unavailable")}
            </p>
          )}
        </div>
      </section>

      <section className="prefs__section" aria-labelledby="layout-h">
        <h2 id="layout-h" className="prefs__heading">
          {t("layout.title")}
        </h2>
        <OptionCard
          selected={prefs.layout === "standard"}
          onSelect={() => update({ layout: "standard" })}
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
          selected={prefs.layout === "guided"}
          onSelect={() => update({ layout: "guided" })}
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

        {/* Live preview: appears only when Guided is chosen, in the chosen wording. */}
        <Guidance message={tw("s1.guidance.country")} />
      </section>

      <div className="prefs__actions">
        <Button onClick={save}>{t("prefs2.save")}</Button>
      </div>
    </Screen>
  );
}
