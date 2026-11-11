
import { useState } from "react";
import {
  UserRound,
  MessageCircle,
  ChevronRight,
  Check,
  AlertCircle,
  Clock3,
  Activity,
  RefreshCw,
  Filter,
  ArrowDownUp,
  Play,
  PanelRightOpen
} from "lucide-react";

import { onboardingSteps } from "../data/mockData";
import useHandoffQueue from "../hooks/useHandoffQueue";
import { socket } from "../socket";
import EmbeddedChat from "../components/EmbeddedChat";
import "./FrictionQueue.css";

function FrictionQueue({ focus }) {
  const applicants = useHandoffQueue();
  const [selectedId, setSelectedId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [resolvedIds, setResolvedIds] = useState([]);

  // "Continue" on the Escalated tab: select that applicant and open the chat (once per click)
  const [handledFocus, setHandledFocus] = useState(null);
  if (focus && focus !== handledFocus) {
    const target = applicants.find((a) => a.sessionId === focus.sessionId);
    if (target) {
      setHandledFocus(focus);
      setSelectedId(String(target.id));
      setChatOpen(true);
    }
  }

  const selected = applicants.find((a) => String(a.id) === selectedId) || applicants[0];

  const handlePickUpChat = (applicantId) => {
    const applicant = applicants.find((a) => String(a.id) === String(applicantId));
    if (applicant && !applicant.staffName) {
      socket.emit("handoff:accepted", { session_id: applicant.sessionId, staff_name: "Sherry Lim" }, (res) => {
        if (!res?.ok && res?.error === "already_taken") alert("Another staff member has picked this up.");
      });
    }
    setSelectedId(String(applicantId));
    setChatOpen(true);
  };

  const handleResolve = (applicantId) => {
    setResolvedIds((previous) =>
      previous.includes(applicantId)
        ? previous
        : [...previous, applicantId]
    );
  };

  if (!selected) {
    return <p>No help requests yet.</p>;
  }

  return (
    <div
      className={`fq-layout ${
        chatOpen ? "fq-chat-open" : "fq-chat-closed"
      }`}
    >
      {/* LEFT: FRICTION QUEUE */}
      <aside className="fq-sidebar">
        <div className="fq-sidebar-heading">
          <div>
            <div className="fq-heading-line">
              <h3>Friction Queue</h3>
              <span className="fq-active-count">
                {applicants.length} Active
              </span>
            </div>

            <small>
              Newest requests appear first
            </small>
          </div>

          <div className="fq-heading-actions">
            <Filter size={14} />
            <ArrowDownUp size={14} />
          </div>
        </div>

        <div className="fq-applicant-list">
          {applicants.map((applicant) => {
            const id = String(applicant.id);
            const resolved = resolvedIds.includes(id);

            return (
              <div
                key={id}
                className={`fq-applicant ${
                  selectedId === id ? "fq-selected" : ""
                }`}
              >
                <div
                  className="fq-applicant-select"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(id)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " "
                    ) {
                      e.preventDefault();
                      setSelectedId(id);
                    }
                  }}
                >
                  <div className="fq-applicant-top">
                    <span className="fq-user-icon">
                      <UserRound size={15} />
                    </span>

                    <div className="fq-applicant-identity">
                      <strong>
                        Applicant #{id}
                      </strong>
                      <small>
                        {applicant.phone}
                      </small>
                    </div>

                    <span className="fq-time">
                      {applicant.time}
                    </span>
                  </div>

                  <p>
                    Step {applicant.step} of 6:{" "}
                    {applicant.stepName}
                  </p>

                  {applicant.detail && (
                    <div className="fq-detail-tag">
                      {applicant.status}
                      <span>
                        {applicant.detail}
                      </span>
                    </div>
                  )}
                </div>

                <div className="fq-applicant-bottom">
                  <button
                    type="button"
                    className="fq-call-tag"
                    onClick={() => handlePickUpChat(id)}
                  >
                    <MessageCircle size={11} />
                    {resolved
                      ? "View Resolved Chat"
                      : "Pick Up Chat"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fq-sidebar-footer">
          <span>
            Average resolution: 2m 16s
          </span>
          <span>SLA: 99.4%</span>
        </div>
      </aside>

      {/* MIDDLE: LIVE SESSION */}
      <section className="fq-main">
        <div className="fq-session-header">
          <div>
            <small>
              SELECTED LIVE SESSION | Session ID:{" "}
              {selected.sessionId}
            </small>

            <h2>
              Applicant #{selected.id}
              <span> · {selected.phone}</span>
            </h2>

            <p>
              Step {selected.step} of 6:{" "}
              {selected.stepName}
            </p>
          </div>

          <div className="fq-session-actions">
            <span className="fq-awaiting">
              {selected.staffName
                ? `Picked up by ${selected.staffName}`
                : "Awaiting pick up"}
            </span>

            <button
              type="button"
              className="fq-icon-button"
              title="Refresh"
              onClick={() =>
                setSelectedId(String(selected.id))
              }
            >
              <RefreshCw size={15} />
            </button>

            {!chatOpen && (
              <button
                type="button"
                className="fq-icon-button"
                title="Open Live Chat"
                aria-label="Open Live Chat"
                onClick={() => setChatOpen(true)}
              >
                <PanelRightOpen size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="fq-main-content">
          {/* CUSTOMER JOURNEY */}
          <div className="fq-section fq-journey">
            <div className="fq-section-title">
              <strong>
                Customer Journey Funnel
              </strong>

              <small>
                Step {selected.step} of 6 active
              </small>
            </div>

            <div className="fq-steps">
              {onboardingSteps.map((step, index) => {
                const number = index + 1;
                const completed = number < selected.step;
                const current = number === selected.step;

                return (
                  <div
                    key={step}
                    className={`fq-step ${
                      completed ? "completed" : ""
                    } ${current ? "current" : ""}`}
                  >
                    <div className="fq-step-circle">
                      {completed ? (
                        <Check size={15} />
                      ) : current ? (
                        <AlertCircle size={17} />
                      ) : (
                        number
                      )}
                    </div>

                    <strong>
                      {number}. {step}
                    </strong>

                    <small>
                      {completed
                        ? "Completed"
                        : current
                        ? selected.error || "Needs help"
                        : "—"}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TELEMETRY */}
          <div className="fq-section">
            <div className="fq-section-title">
              <strong>
                <Activity size={14} />
                Telemetry: {selected.stepName}
              </strong>

              <small>
                Module v2.4.1
              </small>
            </div>

            <div className="fq-telemetry-grid">
              <div className="fq-telemetry-box">
                <div className="fq-metric-label">
                  <span>
                    Time on this step
                  </span>
                  <Clock3 size={14} />
                </div>

                <h2>
                  {selected.inactivity}
                </h2>

                <small>
                  Current session
                </small>
              </div>

              <div className="fq-telemetry-box fq-error-box">
                <div className="fq-metric-label">
                  <span>
                    Failed attempts
                  </span>
                  <AlertCircle size={14} />
                </div>

                <h2>
                  {selected.failedAttempts} failed
                </h2>

                <small>
                  {selected.failedAttempts > 0
                    ? "Critical telemetry threshold met"
                    : "No failures detected"}
                </small>
              </div>

              <div className="fq-telemetry-box">
                <div className="fq-metric-label">
                  <span>
                    Last interaction
                  </span>
                  <Activity size={14} />
                </div>

                <h2>
                  {selected.lastInteraction}
                </h2>
              </div>
            </div>

            <div className="fq-back-navigation">
              Back navigations: 0
            </div>
          </div>

          {/* REAL-TIME EVENT STREAM */}
          <div className="fq-section fq-events">
            <div className="fq-section-title">
              <strong>
                <Activity size={14} />
                Real-Time Event Stream
              </strong>

              <small>
                Ordered chronologically (Live)
              </small>
            </div>

            <div className="fq-event-list">
              {selected.events.length === 0 ? (
                <p className="fq-no-events">
                  No recent events recorded.
                </p>
              ) : (
                selected.events.map((event, index) => (
                  <div
                    className="fq-event"
                    key={index}
                  >
                    <span
                      className={`fq-event-dot ${event.type}`}
                    />

                    <time>
                      {event.time}
                    </time>

                    <strong>
                      {event.message}
                    </strong>

                    {event.code && (
                      <code>
                        {event.code}
                      </code>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="fq-action-bar">
          <button
            type="button"
            className="fq-tip-button"
          >
            <Play size={13} />
            Push NFC Tip
          </button>

          <button
            type="button"
            className="fq-pickup-button"
            onClick={() =>
              handlePickUpChat(selectedId)
            }
          >
            <MessageCircle size={14} />
            {chatOpen ? "View Live Chat" : "Pick Up Chat"}
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      {/* RIGHT: COLLAPSIBLE LIVE CHAT */}
      <div
        className={`fq-chat-column ${
          chatOpen ? "" : "fq-chat-hidden"
        }`}
        aria-hidden={!chatOpen}
      >
        <EmbeddedChat
          applicant={selected}
          onClose={() => setChatOpen(false)}
          onResolve={handleResolve}
        />
      </div>
    </div>
  );
}

export default FrictionQueue;
