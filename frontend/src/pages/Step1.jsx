import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Cake,
  Calendar,
  ChevronDown,
  Globe,
  Info,
} from "lucide-react";
import StepScreen from "../components/StepScreen";
import StatusBanner from "../components/StatusBanner";
import Guidance from "../components/Guidance";
import Card from "../components/Card";
import Button from "../components/Button";
import Field from "../components/Field";
import DetailRow from "../components/DetailRow";
import { usePreferences } from "../context/PreferencesContext";
import { useJourney } from "../context/JourneyContext";
import { useHelp } from "../context/HelpContext";
import usePageView from "../hooks/usePageView";
import useT from "../i18n/useT";
import { getPage, pageText, pageTitle } from "../data/content";
import { COUNTRIES, countryName } from "../data/countries";
import { ageFrom, formatDob, parseDob } from "../utils/dob";
import { checkEligibility, logEvent } from "../api/client";
import PageReadAloud from "../components/PageReadAloud";
import GuidedTour from "../guidance/GuidedTour";

export default function Step1() {
  const navigate = useNavigate();
  const { t, tw, lang } = useT();
  const { prefs } = usePreferences();
  const {
    sessionId,
    applicant,
    saveApplicant,
    eligibility,
    setEligibility,
    clearEligibility,
    endJourney,
  } = useJourney();
  const { openStaff } = useHelp();
  const page = getPage("account.step1");
  usePageView("account.step1");

  const [country, setCountry] = useState(applicant.country);
  const [dob, setDob] = useState(applicant.dob);
  const [dobError, setDobError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | error

  const ready = Boolean(country) && dob.replace(/\D/g, "").length === 8;
  const guidanceMessage = !country
    ? tw("s1.guidance.country")
    : !ready
      ? tw("s1.guidance.dob")
      : tw("s1.guidance.check");
  const title = pageTitle(page._id, lang);
  const intro = (
    <p className="step__intro">{pageText(page, prefs.wording, lang)}</p>
  );

  async function submit(e) {
    e.preventDefault();
    const date = parseDob(dob);
    if (!date) {
      setDobError(tw("s1.dob.error"));
      return;
    }
    setDobError("");
    setStatus("checking");
    try {
      const result = await checkEligibility({
        passport_country: country,
        is_18_or_older: ageFrom(date) >= 18,
      });
      saveApplicant({ country, dob });
      if (!result.eligible)
        logEvent(sessionId, "account.step1", "error", { code: result.code });
      setEligibility(result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function saveAndExit() {
    await endJourney("not_eligible");
    navigate("/welcome");
  }

  // ---- Eligible
  if (eligibility?.eligible) {
    const age = ageFrom(parseDob(applicant.dob));
    return (
      <StepScreen
        step={1}
        onBack={() => navigate("/signup")}
        footer={
          <Button data-guide="continue" onClick={() => navigate("/step/2")}>
            {t("common.continue")}
          </Button>
        }
      >
        <h1 className="step__title">{title}</h1>
        <PageReadAloud
          text={[
            title,
            pageText(page, prefs.wording, lang),
            tw("s1.guidance.continue"),
          ]
            .filter(Boolean)
            .join(". ")}
        />
        {intro}
        <Guidance message={tw("s1.guidance.continue")} />
        <GuidedTour
          steps={[
            {
              id: "continue",
              target: '[data-guide="continue"]',
              when: true,
              guidanceKey: "s1.guidance.continue",
              side: "top",
            },
          ]}
        />
        <StatusBanner variant="success" label={t("s1.eligible.label")}>
          {tw("s1.eligible.text")}
        </StatusBanner>
        <Card className="details">
          <h2 className="details__title">{t("detail.yourDetails")}</h2>
          <DetailRow
            icon={BookOpen}
            label={t("detail.country")}
            value={countryName(applicant.country, lang)}
            onEdit={clearEligibility}
          />
          <DetailRow
            icon={Cake}
            label={t("detail.age")}
            value={t("detail.ageValue", { n: age })}
            onEdit={clearEligibility}
          />
        </Card>
        <p className="step__note">
          <Info size={16} aria-hidden="true" />
          {tw("s1.note")}
        </p>
      </StepScreen>
    );
  }

  // ---- Not eligible
  if (eligibility && !eligibility.eligible) {
    const ageFailed = eligibility.code === "AGE_REQUIREMENT";
    return (
      <StepScreen
        step={1}
        onBack={() => navigate("/signup")}
        footer={
          <>
            <Button data-guide="change" onClick={clearEligibility}>
              {t("s1.change")}
            </Button>
            <Button variant="secondary" onClick={openStaff}>
              {t("s1.contact")}
            </Button>
            <Button variant="tertiary" onClick={saveAndExit}>
              {t("s1.saveExit")}
            </Button>
          </>
        }
      >
        <h1 className="step__title">{t("s1.no.title")}</h1>
        <PageReadAloud
          text={[t("s1.no.title"), tw("s1.no.intro"), tw("s1.guidance.update")]
            .filter(Boolean)
            .join(". ")}
        />
        <p className="step__intro">{tw("s1.no.intro")}</p>
        <Guidance message={tw("s1.guidance.update")} />
        <GuidedTour
          steps={[
            {
              id: "change",
              target: '[data-guide="change"]',
              when: true,
              guidanceKey: "s1.guidance.update",
              side: "top",
            },
          ]}
        />
        <StatusBanner variant="error" label={t("s1.no.label")}>
          {tw(`s1.no.${eligibility.code}`)}
        </StatusBanner>
        <Card className="details">
          <DetailRow
            icon={Globe}
            label={t("detail.country")}
            value={countryName(applicant.country, lang)}
            onEdit={clearEligibility}
          />
          {ageFailed && (
            <DetailRow
              icon={Cake}
              label={t("detail.age")}
              value={t("detail.ageValue", {
                n: ageFrom(parseDob(applicant.dob)),
              })}
              onEdit={clearEligibility}
            />
          )}
        </Card>
      </StepScreen>
    );
  }

  // ---- Form
  return (
    <StepScreen
      step={1}
      onBack={() => navigate("/signup")}
      footer={
        <Button
          type="submit"
          form="eligibility-form"
          data-guide="check"
          disabled={!ready}
          loading={status === "checking"}
        >
          {status === "checking" ? t("common.checking") : t("s1.check")}
        </Button>
      }
    >
      <h1 className="step__title">{title}</h1>
      <PageReadAloud
        text={[title, pageText(page, prefs.wording, lang), guidanceMessage]
          .filter(Boolean)
          .join(". ")}
      />
      {intro}
      <Guidance message={guidanceMessage} />
      <GuidedTour
        steps={[
          {
            id: "country",
            target: "#country",
            when: !country,
            guidanceKey: "s1.guidance.country",
          },
          {
            id: "dob",
            target: "#dob",
            when: Boolean(country) && !ready,
            guidanceKey: "s1.guidance.dob",
          },
          {
            id: "check",
            target: '[data-guide="check"]',
            when: ready && status !== "checking",
            guidanceKey: "s1.guidance.check",
            side: "top",
          },
        ]}
      />
      {status === "error" && (
        <StatusBanner variant="error" label={t("s1.error.label")}>
          {tw("common.savedTryAgain")}
        </StatusBanner>
      )}
      <form
        id="eligibility-form"
        className="form-card"
        onSubmit={submit}
        noValidate
      >
        <Field id="country" label={t("detail.country")}>
          <div className="control-wrap">
            <select
              id="country"
              className="control"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="" disabled>
                {t("s1.country.placeholder")}
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryName(c.code, lang)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="control-icon"
              size={20}
              aria-hidden="true"
            />
          </div>
        </Field>
        <Field id="dob" label={t("s1.dob")} error={dobError}>
          <div className="control-wrap">
            <input
              id="dob"
              className={`control ${dobError ? "control--error" : ""}`.trim()}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("s1.dob.placeholder")}
              value={dob}
              onChange={(e) => {
                setDob(formatDob(e.target.value));
                setDobError("");
              }}
              aria-invalid={dobError ? true : undefined}
              aria-describedby={dobError ? "dob-error" : undefined}
            />
            <Calendar className="control-icon" size={20} aria-hidden="true" />
          </div>
        </Field>
      </form>
    </StepScreen>
  );
}
