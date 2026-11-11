import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useT from "../i18n/useT";
import "./Splash.css";

export default function Splash() {
  const navigate = useNavigate();
  const { t } = useT();

  useEffect(() => {
    const timer = setTimeout(
      () => navigate("/welcome", { replace: true }),
      1000,
    );
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash" role="status" aria-label={t("splash.loading")}>
      <h1 className="splash__name">OCBC Sense</h1>
      <p className="splash__tag">{t("splash.tagline")}</p>
      <span className="splash__spinner" aria-hidden="true" />
    </div>
  );
}
