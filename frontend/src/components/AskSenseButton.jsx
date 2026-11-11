import { MessageSquare } from "lucide-react";
import "./AskSenseButton.css";
import useT from "../i18n/useT";
import { useHelp } from "../context/HelpContext";

export default function AskSenseButton({ onClick }) {
  const { t } = useT();
  const { level } = useHelp();

  const needsProactiveHelp = level >= 2;

  return (
    <div className="ask-sense-row">
      <button className="ask-sense" onClick={onClick}>
        <MessageSquare size={20} aria-hidden="true" />
        {t("help.button")}
      </button>
    </div>
  );
}
