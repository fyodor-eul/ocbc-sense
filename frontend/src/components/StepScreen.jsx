import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "./Screen";
import Header from "./Header";
import StepList from "./StepList";
import ProgressBar from "./ProgressBar";
import AskSenseButton from "./AskSenseButton";
import StatusBanner from "./StatusBanner";
import { useHelp } from "../context/HelpContext";
import { pageTitle } from "../data/content";
import { tipFor } from "../data/answers";
import useT from "../i18n/useT";
import "./StepScreen.css";

export default function StepScreen({
  step,
  onBack,
  footer,
  progressRight,
  children,
}) {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const { openHelp, level } = useHelp();
  const stepTitles = [1, 2, 3, 4, 5, 6].map((n) =>
    pageTitle(`account.step${n}`, lang),
  );
  const tip = tipFor(`account.step${step}`, lang);
  const guideRef = useRef(null);

  // Level 2: glow the main button (and show the arrow) if it can be pressed.
  useEffect(() => {
    const el = guideRef.current;
    if (!el) return;
    el.classList.toggle(
      "guide--on",
      level >= 2 && !!el.querySelector(".btn--primary:not(:disabled)"),
    );
  });

  return (
    <Screen
      header={
        <Header onBack={onBack} onSettings={() => navigate("/settings")} />
      }
      aside={<StepList steps={stepTitles} current={step} />}
      footer={
        <>
          <div className="guide" ref={guideRef}>
            {footer}
          </div>
          <AskSenseButton onClick={openHelp} />
        </>
      }
    >
      <ProgressBar current={step} right={progressRight} />

      {children}
    </Screen>
  );
}
