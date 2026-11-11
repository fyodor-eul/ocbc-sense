import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Fingerprint, Info, Smartphone, Zap } from "lucide-react";
import Screen from "../components/Screen";
import Header from "../components/Header";
import OptionCard from "../components/OptionCard";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import StatusBanner from "../components/StatusBanner";
import Guidance from "../components/Guidance";
import GuidedTour from "../guidance/GuidedTour";
import { usePreferences } from "../context/PreferencesContext";
import { useJourney } from "../context/JourneyContext";
import useT from "../i18n/useT";
import { getPage, pageText } from "../data/content";
import "./SignUp.css";
import PageReadAloud from "../components/PageReadAloud";

export default function SignUp() {
  const navigate = useNavigate();
  const { t, tw, lang } = useT();
  const { prefs } = usePreferences();
  const { startJourney } = useJourney();
  const [singpassInfo, setSingpassInfo] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | starting | error
  const page = getPage("start");

  async function start() {
    setStatus("starting");
    try {
      await startJourney(prefs);
      navigate("/step/1");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Screen
        header={
          <Header
            onBack={() => navigate("/preferences/saved")}
            onSettings={() => navigate("/settings")}
          />
        }
        footer={
          <Button onClick={start} loading={status === "starting"}>
            {status === "starting"
              ? t("signup.starting")
              : t("common.continue")}
          </Button>
        }
      >
        <h1 className="signup__title">{t("signup.title")}</h1>
        <PageReadAloud
          text={[
            t("signup.title"),
            pageText(page, prefs.wording, lang),
            tw("signup.guidance.choose"),
          ].filter(Boolean).join(". ")}
        />
        <p className="step__intro">
          {pageText(page, prefs.wording, lang)}
        </p>
        <Guidance message={tw("signup.guidance.choose")} />
        <GuidedTour
          steps={[
            {
              id: "option",
              target: ".option--on",
              when: !singpassInfo,
              guidanceKey: "signup.guidance.choose",
            },
          ]}
        />

        <OptionCard selected={false} onSelect={() => setSingpassInfo(true)}>
          <span className="reg">
            <span className="reg__top">
              <span className="reg__icon" aria-hidden="true">
                <Fingerprint size={22} />
              </span>
              <span className="reg__name">Singpass</span>
            </span>
            <span className="reg__desc">{t("singpass.desc")}</span>
          </span>
        </OptionCard>

        <OptionCard selected onSelect={() => {}}>
          <span className="reg">
            <span className="reg__top">
              <span className="reg__icon" aria-hidden="true">
                <BookOpen size={22} />
              </span>
              <span className="reg__name">{t("epassport.name")}</span>
              <span className="reg__tag">{t("epassport.tag")}</span>
            </span>
            <span className="reg__desc">{t("epassport.desc")}</span>
            <span className="reg__feature">
              <Smartphone size={14} aria-hidden="true" />{" "}
              {t("epassport.feature")}
            </span>
          </span>
        </OptionCard>

        {status === "error" && (
          <StatusBanner variant="error" label={t("signup.error.label")}>
            {t("signup.error.text")}
          </StatusBanner>
        )}
      </Screen>

      <Dialog
        open={singpassInfo}
        onClose={() => setSingpassInfo(false)}
        title={t("singpass.dialog.title")}
      >
        <p className="dialog__body">{t("singpass.dialog.body")}</p>
        <Button onClick={() => setSingpassInfo(false)}>
          {t("singpass.dialog.cta")}
        </Button>
      </Dialog>
    </>
  );
}
