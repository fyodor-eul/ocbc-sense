import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen";
import Header from "../components/Header";
import LanguagePill from "../components/LanguagePill";
import Button from "../components/Button";
import PassportPhoneArt from "../components/PassportPhoneArt";
import { usePreferences } from "../context/PreferencesContext";
import { useJourney } from "../context/JourneyContext";
import useT from "../i18n/useT";
import PageReadAloud from "../components/PageReadAloud";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();
  const journey = useJourney();
  const { t } = useT();
  const { prefs, update, startSetup } = usePreferences();

  function createAccount() {
    journey.reset();
    startSetup();
    navigate("/preferences/1");
  }

  return (
    <Screen header={<Header />}>
      <PassportPhoneArt />
      <div className="welcome__text">
        <h1>{t("welcome.title")}</h1>
        <PageReadAloud
          text={[t("welcome.title"), t("welcome.body")].filter(Boolean).join(". ")}
        />
        <p>{t("welcome.body")}</p>
      </div>
      <div className="welcome__actions">
        <Button variant="secondary" onClick={() => navigate("/login")}>
          {t("welcome.login")}
        </Button>
        <Button onClick={createAccount}>{t("welcome.create")}</Button>
      </div>
    </Screen>
  );
}
