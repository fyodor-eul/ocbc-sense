// The "View Summary" panel under a case: hand-off times and outcome.
import { formatSeconds } from "../hooks/useHandoffs";

const time = (t) =>
  t ? new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function CaseSummary({ item }) {
  return (
    <div className="eh-case-summary">
      <dl className="eh-case-summary-facts">
        <div><dt>Session</dt><dd>{item.sessionId}</dd></div>
        <div><dt>Asked for help</dt><dd>{time(item.requestedAt)}</dd></div>
        <div><dt>Picked up</dt><dd>{time(item.acceptedAt)} (waited {formatSeconds(item.waitS)})</dd></div>
        <div><dt>Resolved</dt><dd>{time(item.resolvedAt)} (helped for {formatSeconds(item.helpS)})</dd></div>
        <div><dt>Hand-offs in this session</dt><dd>{item.handoffCount}</dd></div>
        <div><dt>Outcome</dt><dd>{item.outcome}</dd></div>
      </dl>
    </div>
  );
}

export default CaseSummary;
