
import { Fragment, useState } from "react";
import {
  UserRound,
  Clock3,
  AlertTriangle,
  Ban,
  EyeOff,
  ChevronRight,
  BriefcaseBusiness
} from "lucide-react";

import useHandoffs from "../hooks/useHandoffs";
import { socket } from "../socket";
import CaseSummary from "../components/CaseSummary";
import "./EscalatedHelp.css";

function EscalatedHelp({ onOpenChat }) {
  // real hand-offs from MongoDB (GET /api/handoffs), reloaded on every change
  const cases = useHandoffs();
  const [summaryId, setSummaryId] = useState(null);

  // grouped by the session's outcome, exactly as stored in MongoDB
  const pending = cases.filter(
    (item) => item.outcome === "in_progress"
  );

  const solved = cases.filter(
    (item) => item.outcome === "submitted"
  );

  const unable = cases.filter(
    (item) =>
      item.outcome === "not_eligible" ||
      item.outcome === "abandoned"
  );

  // Continue: open the live chat in the Friction Queue (open hand-offs only)
  const continueCase = (item) => {
    if (item.status === "waiting") {
      // not picked up yet: Continue picks it up, like "Pick Up Chat"
      socket.emit("handoff:accepted", { session_id: item.sessionId, staff_name: "Sherry Lim" }, (res) => {
        if (!res?.ok && res?.error === "already_taken") alert("Another staff member has picked this up.");
      });
    }
    onOpenChat(item.sessionId);
  };

  // View Summary: show or hide the hand-off times and the transcript under the case
  const viewSummary = (sessionId) => {
    setSummaryId((current) => (current === sessionId ? null : sessionId));
  };

  const summaryFor = (item) =>
    summaryId === item.sessionId && <CaseSummary item={item} />;

  const sessionLine = (item) =>
    `${item.sessionId}${item.source === "synthetic" ? " · demo data" : ""}`;

  return (
    <div className="eh-page">
      <div className="eh-page-header">
        <div>
          <div className="eh-title-row">
            <h1>Escalated to Staff Help</h1>
            <span className="eh-total">
              {cases.length} Cases
            </span>
          </div>

          <p>
            Review requests and take ownership of assistance
            across three distinct outcome status groups.
          </p>
        </div>

        <div className="eh-summary">
          <span className="eh-summary-blue">
            {pending.length} In Progress
          </span>

          <span className="eh-summary-green">
            {solved.length} Submitted
          </span>

          <span className="eh-summary-red">
            {unable.length} Ineligible / Dropped
          </span>
        </div>
      </div>

      {/* PENDING & ACTIVE REVIEW */}
      <section className="eh-group">
        <div className="eh-group-heading">
          <div className="eh-group-title">
            <span className="eh-marker blue" />

            <h2>Pending & Active Review</h2>

            <span className="eh-outcome blue">
              outcome: "in_progress"
            </span>

            <span className="eh-count">
              {pending.length} {pending.length === 1 ? "Case" : "Cases"}
            </span>
          </div>

          <small>
            Cases currently being investigated or awaiting
            staff action.
          </small>
        </div>

        <div className="eh-case-list">
          {pending.map((item) => (
            <Fragment key={item.sessionId}>
            <div className="eh-case pending">
              <div className="eh-applicant">
                <UserRound size={17} />

                <div>
                  <strong>Applicant #{item.id}</strong>
                  <small>{sessionLine(item)}</small>
                </div>
              </div>

              <div className="eh-case-info">
                <strong>
                  BLOCKED WORKFLOW STAGE: {item.step}
                </strong>

                <div className="eh-case-tags">
                  {item.error && (
                    <span className="eh-warning-tag">
                      <AlertTriangle size={12} />
                      {item.error}
                    </span>
                  )}

                  <code>{item.status}</code>
                </div>
              </div>

              <div className="eh-case-duration">
                <span>HAND-OFF</span>

                <strong className={item.status === "resolved" ? "eh-green-text" : "eh-red-text"}>
                  <Clock3 size={13} />
                  {item.statusLabel}
                </strong>
              </div>

              <div className="eh-buttons">
                <button
                  className="eh-outline-button"
                  onClick={() => viewSummary(item.sessionId)}
                >
                  View Case
                  <ChevronRight size={14} />
                </button>

                {item.status !== "resolved" && item.source === "live" && (
                  <button
                    className="eh-red-button"
                    onClick={() => continueCase(item)}
                  >
                    Continue
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
            {summaryFor(item)}
            </Fragment>
          ))}
        </div>
      </section>

      {/* SOLVED CASES */}
      <section className="eh-group">
        <div className="eh-group-heading">
          <div className="eh-group-title">
            <span className="eh-marker green" />

            <h2>Solved Cases</h2>

            <span className="eh-outcome green">
              ✓ Solved & Application Submitted
            </span>

            <span className="eh-count">
              {solved.length} {solved.length === 1 ? "Case" : "Cases"}
            </span>
          </div>

          <small>
            Frictions successfully resolved; onboarding
            application completed and submitted.
          </small>
        </div>

        <div className="eh-case-list">
          {solved.map((item) => (
            <Fragment key={item.sessionId}>
            <div className="eh-case solved">
              <div className="eh-applicant">
                <BriefcaseBusiness size={17} />

                <div>
                  <strong>Applicant #{item.id}</strong>
                  <small>{sessionLine(item)}</small>
                </div>
              </div>

              <div className="eh-case-info">
                <strong>
                  HELPED ON: {item.step}
                </strong>

                <div className="eh-case-tags">
                  <span className="eh-pass-tag">
                    {item.statusLabel}
                  </span>
                  {item.error && <code>{item.error}</code>}
                </div>
              </div>

              <div className="eh-case-duration">
                <span>OUTCOME STATUS</span>

                <strong className="eh-green-text">
                  Application submitted
                </strong>

                <small>{item.endedLabel}</small>
              </div>

              <div className="eh-buttons">
                <button
                  className="eh-green-button"
                  onClick={() => viewSummary(item.sessionId)}
                >
                  View Summary
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {summaryFor(item)}
            </Fragment>
          ))}
        </div>
      </section>

      {/* UNABLE TO SOLVE */}
      <section className="eh-group">
        <div className="eh-group-heading">
          <div className="eh-group-title">
            <span className="eh-marker red" />

            <h2>Unable to Solve</h2>

            <span className="eh-outcome red">
              Outcome: "not_eligible"
            </span>

            <span className="eh-outcome amber">
              Outcome: "abandoned"
            </span>

            <span className="eh-count">
              {unable.length} {unable.length === 1 ? "Case" : "Cases"}
            </span>
          </div>

          <small>
            Cases that ended without completion due to user
            drop-off or verification disqualification.
          </small>
        </div>

        <div className="eh-case-list unable">
          {unable.map((item) => (
            <Fragment key={item.sessionId}>
            <div className="eh-case failed">
              <div className="eh-applicant">
                {item.outcome === "not_eligible" ? (
                  <Ban size={17} />
                ) : (
                  <EyeOff size={17} />
                )}

                <div>
                  <strong>Applicant #{item.id}</strong>
                  <small>{sessionLine(item)}</small>
                </div>
              </div>

              <div className="eh-case-info">
                <strong>
                  LAST HELP ON: {item.step}
                </strong>

                <div className="eh-case-tags">
                  <span
                    className={
                      item.outcome === "not_eligible"
                        ? "eh-failed-tag"
                        : "eh-abandoned-tag"
                    }
                  >
                    {item.outcome}
                  </span>

                  {item.error && <code>{item.error}</code>}
                </div>
              </div>

              <div className="eh-case-duration">
                <span>OUTCOME</span>

                <strong>{item.endedLabel}</strong>

                <small>
                  {item.outcome === "not_eligible"
                    ? "Not eligible for remote sign-up"
                    : "Left before submitting"}
                </small>
              </div>

              <div className="eh-buttons">
                <button
                  className="eh-failed-button"
                  onClick={() => viewSummary(item.sessionId)}
                >
                  View Summary
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {summaryFor(item)}
            </Fragment>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="eh-footer">
        <span>
          OCBC Enterprise Client Verification Architecture
          v4.12
        </span>

        <span>
          Connected Node: SG-ONB-PRD-04
        </span>

        <span className="eh-healthy">
          ● Singapore Telemetry Gateway Healthy
        </span>

        <span>
          All identity queries logged in accordance with
          MAS Technology Risk Management Guidelines
        </span>
      </footer>
    </div>
  );
}

export default EscalatedHelp;