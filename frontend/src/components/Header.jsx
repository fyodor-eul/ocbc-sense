import { ArrowLeft, Settings } from "lucide-react";
import Wordmark from "./Wordmark";
import useT from "../i18n/useT";
import "./Header.css";

export default function Header({ onBack, onSettings, right, desktopOnly }) {
  const { t } = useT();
  return (
    <header
      className={`app-header ${desktopOnly ? "app-header--desktop-only" : ""}`.trim()}
    >
      <div className="app-header__inner">
        <div className="app-header__left">
          {onBack && (
            <button
              className="app-header__icon"
              onClick={onBack}
              aria-label={t("common.back")}
            >
              <ArrowLeft size={24} aria-hidden="true" />
            </button>
          )}
          <Wordmark />
        </div>

        <div className="app-header__right">
          <button
            className="app-header__icon"
            onClick={onSettings}
            aria-label={t("common.settings")}
          >
            <Settings size={24} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
