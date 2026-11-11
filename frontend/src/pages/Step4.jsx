import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, RotateCcw } from "lucide-react";
import StepScreen from "../components/StepScreen";
import StatusBanner from "../components/StatusBanner";
import Card from "../components/Card";
import Button from "../components/Button";
import Guidance from "../components/Guidance";
import GuidedTour from "../guidance/GuidedTour";
import PageReadAloud from "../components/PageReadAloud";
import CameraView from "../components/CameraView";
import { useJourney } from "../context/JourneyContext";
import { usePresenter } from "../context/PresenterContext";
import { useHelp } from "../context/HelpContext";
import usePageView from "../hooks/usePageView";
import useT from "../i18n/useT";
import { getPage, pageTitle } from "../data/content";
import { simulateFaceCheck } from "../api/simulate";
import { logEvent } from "../api/client";

export default function Step4() {
  const navigate = useNavigate();
  const { t, tw, lang } = useT();
  const { sessionId, done, attempts, markDone, recordAttempt } = useJourney();
  const { scenarios } = usePresenter();
  const { openStaff } = useHelp();
  const page = getPage("account.step4");
  usePageView("account.step4");

  // camera | checking | error | success
  const [stage, setStage] = useState(done.face ? "success" : "camera");
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const runId = useRef(0);

  useEffect(
    () => () => {
      runId.current += 1;
    },
    [],
  );

  async function takeSelfie(capturedImage) {
    const id = ++runId.current;

    setStage("checking");

    const attempt = attempts.face;

    recordAttempt("face");

    try {
      /*
      IMPORTANT:

      capturedImage exists only temporarily in memory.

      Do NOT:
      - upload it
      - save it to localStorage
      - save it to a database
      - store it in React state permanently

      We are only using it to represent the completed
      capture step before simulated verification.
    */

      const result = await simulateFaceCheck(scenarios.face, attempt);

      if (id !== runId.current) return;

      if (result.ok) {
        markDone("face");
        setStage("success");
      } else {
        logEvent(sessionId, "account.step4", "error", { code: result.code });

        setStage("error");
      }

      // capturedImage reference goes out of scope
      // after this function finishes
    } finally {
      // Nothing stored
    }
  }

  function cancelCheck() {
    runId.current += 1;
    setStage("camera");
  }

  const frame = (footer, body) => (
    <StepScreen step={4} onBack={() => navigate("/step/3")} footer={footer}>
      {body}
    </StepScreen>
  );
  const title = pageTitle(page._id, lang);
  const guidanceMessage =
    stage === "checking"
      ? tw("s4.guidance.review")
      : stage === "success"
        ? tw("s4.guidance.continue")
        : stage === "error"
          ? tw("s4.guidance.retry")
          : cameraReady
            ? tw("s4.guidance.capture")
            : tw("s4.guidance.frame");

  if (stage === "checking") {
    return frame(
      <>
        <Button disabled loading>
          {t("common.checking")}
        </Button>
        <Button variant="tertiary" onClick={cancelCheck}>
          {t("s4.cancel")}
        </Button>
      </>,
      <>
        <h1 className="step__title">{t("s4.checking.title")}</h1>
        <PageReadAloud
          text={[t("s4.checking.title"), guidanceMessage]
            .filter(Boolean)
            .join(". ")}
        />
        <Guidance message={guidanceMessage} />
        <StatusBanner variant="loading" label={t("s4.checking.label")}>
          {t("common.keepOpen")}
        </StatusBanner>
      </>,
    );
  }

  if (stage === "success") {
    const rows = [
      { label: t("s4.row.chip"), status: t("s4.status.read") },
      { label: t("s4.row.selfie"), status: t("s4.status.received") },
    ];
    return frame(
      <Button
        type="button"
        data-guide="continue"
        onClick={() => navigate("/step/5")}
      >
        {t("common.continue")}
      </Button>,
      <>
        <h1 className="step__title">{title}</h1>
        <PageReadAloud
          text={[title, guidanceMessage].filter(Boolean).join(". ")}
        />
        <Guidance message={guidanceMessage} />
        <GuidedTour
          steps={[
            {
              id: "continue",
              target: '[data-guide="continue"]',
              when: true,
              guidanceKey: "s4.guidance.continue",
              side: "top",
            },
          ]}
        />
        <StatusBanner variant="success" label={t("s4.success.label")}>
          {t("s4.success.text")}
        </StatusBanner>
        <Card className="details">
          <h2 className="details__title">{t("s4.checked")}</h2>
          {rows.map((r) => (
            <div className="detail" key={r.label}>
              <span
                className="detail__icon detail__icon--ok"
                aria-hidden="true"
              >
                <Check size={18} />
              </span>
              <span className="detail__text">
                <span className="detail__value">{r.label}</span>
              </span>
              <span className="detail__status">{r.status}</span>
            </div>
          ))}
        </Card>
      </>,
    );
  }

  const failed = stage === "error";

  const footer = failed ? (
    <>
      <Button data-guide="retake" onClick={() => setStage("camera")}>
        <RotateCcw size={18} aria-hidden="true" />
        {t("s4.retake.face")}
      </Button>

      <Button variant="secondary" onClick={openStaff}>
        {t("common.staff")}
      </Button>
    </>
  ) : null;

  return frame(
    footer,
    <>
      <h1 className="step__title">{title}</h1>

      <PageReadAloud
        text={[title, tw("s4.face"), guidanceMessage]
          .filter(Boolean)
          .join(". ")}
      />

      <p className="step__intro">{tw("s4.face")}</p>

      <Guidance message={guidanceMessage} />

      <GuidedTour
        steps={[
          {
            id: "camera",
            target: '[data-guide="camera"]',
            when: !failed && !cameraReady,
            guidanceKey: "s4.guidance.frame",
          },
          {
            id: "capture",
            target: '[data-guide="capture"]',
            when: !failed && cameraReady,
            guidanceKey: "s4.guidance.capture",
            side: "top",
          },
          {
            id: "retake",
            target: '[data-guide="retake"]',
            when: failed,
            guidanceKey: "s4.guidance.retry",
            side: "top",
          },
        ]}
      />

      {failed ? (
        <>
          <StatusBanner variant="error" label={t("s4.fail.face.label")}>
            {tw("common.withSaved", {
              text: tw("s4.fail.face.text"),
            })}
          </StatusBanner>

          <StatusBanner variant="tip" label={t("common.tryThis")}>
            {tw("s4.fail.face.tip")}
          </StatusBanner>
        </>
      ) : (
        <>
          <CameraView
            shape="face"
            onCapture={takeSelfie}
            onReadyChange={setCameraReady}
          >
            {t("s4.face.hint")}
          </CameraView>

          <p className="step__caption">{tw("s4.face.caption")}</p>
        </>
      )}
    </>,
  );
}
