
import { useState } from "react";
import {
  Send,
  Paperclip,
  Phone,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  PanelRightClose,
  ShieldCheck
} from "lucide-react";

import useChat from "../hooks/useChat";
import "../pages/LiveChat.css";

const suggestions = [
  "Hold your phone flat on the passport and keep still.",
  "Try removing your phone case and scanning again.",
  "Upload a clearer photo, in good light.",
  "Please try again now."
];

function EmbeddedChat({
  applicant,
  onClose,
  onResolve
}) {
  const applicantId = applicant?.id;
  const [drafts, setDrafts] = useState({});
  const { messages, send, resolve } = useChat(applicant?.sessionId);

  // the chat panel's view of the selected applicant (live data, not mock)
  const selectedChat = applicant
    ? {
        id: applicant.id,
        phone: applicant.staffName ? `With ${applicant.staffName}` : "Waiting for pick up",
        status: "Active",
        step: `Step ${applicant.step}: ${applicant.stepName}`,
        error: applicant.error,
        messages
      }
    : null;

  const message = drafts[String(applicantId)] || "";

  const updateMessage = (value) => {
    setDrafts((previous) => ({
      ...previous,
      [String(applicantId)]: value
    }));
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    // the server saves it and sends it back to everyone in the chat, so no local copy is added here
    const res = await send(message.trim());
    if (!res?.ok) {
      alert(res?.error === "not_picked_up" ? "Pick up the chat first." : `Not sent: ${res?.error}`);
      return;
    }
    updateMessage("");
  };

  const resolveChat = async () => {
    if (!selectedChat) return;
    await resolve();
    updateMessage("");
    onResolve?.(String(applicantId));
  };

  return (
    <section className="ec-panel">
      {/* CHAT HEADER */}
      <div className="ec-panel-heading">
        <div>
          <div className="ec-title">
            <span className="ec-online-dot" />
            <strong>Live Chat</strong>
          </div>
          <small>
            Staff Assistance · Sherry Lim
          </small>
        </div>

        <button
          type="button"
          className="ec-close-button"
          onClick={onClose}
          title="Collapse Live Chat"
          aria-label="Collapse Live Chat"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      {!selectedChat ? (
        <div className="ec-empty">
          No chat found for this applicant.
        </div>
      ) : (
        <>
          {/* CUSTOMER HEADER */}
          <div className="lc-customer-header">
            <div className="lc-customer-identity">
              <div className="lc-customer-avatar">
                A{selectedChat.id}
              </div>

              <div>
                <h2>
                  Applicant #{selectedChat.id}
                </h2>

                <p>
                  {selectedChat.phone} ·{" "}
                  {selectedChat.status === "Resolved"
                    ? "Resolved"
                    : "Active Now"}
                </p>

                <small>
                  {selectedChat.step}
                </small>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="ec-case-actions">
            <button
              type="button"
              className="lc-escalate"
              onClick={() =>
                alert(
                  `Escalate Applicant #${selectedChat.id}`
                )
              }
            >
              <Phone size={13} />
              Escalate Case
            </button>

            <button
              type="button"
              className="lc-resolve"
              onClick={resolveChat}
              disabled={selectedChat.status === "Resolved"}
            >
              <CheckCircle2 size={13} />
              {selectedChat.status === "Resolved"
                ? "Chat Resolved"
                : "Resolve & Close"}
            </button>
          </div>

          {/* CONVERSATION */}
          <div className="lc-conversation">
            <div className="lc-date-divider">
              Today
            </div>

            {selectedChat.error && (
              <div className="lc-system-alert">
                <AlertTriangle size={15} />
                <span>
                  Friction detected: {selectedChat.error}
                </span>
              </div>
            )}

            <div className="lc-messages">
              {selectedChat.messages.map((item, index) => (
                <div
                  key={index}
                  className={`lc-message-row ${item.sender}`}
                >
                  <div className="lc-message-content">
                    <div className="lc-message-meta">
                      <strong>
                        {item.sender === "staff"
                          ? item.staffName || "Staff"
                          : `Applicant #${selectedChat.id}`}
                      </strong>
                      <span>{item.time}</span>
                    </div>

                    <div className="lc-bubble">
                      {item.text}
                    </div>

                    {item.sender === "staff" && (
                      <small className="lc-delivered">
                        ✓ Sent
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUGGESTED REPLIES */}
          <div className="lc-suggestions">
            <Lightbulb size={14} />
            <span>Suggested:</span>

            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => updateMessage(suggestion)}
                disabled={selectedChat.status === "Resolved"}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* MESSAGE INPUT */}
          <div className="lc-input-area">
            <button
              type="button"
              className="lc-attach"
              title="Attachments"
              onClick={() =>
                alert("Attachment feature coming soon")
              }
            >
              <Paperclip size={16} />
            </button>

            <button
              type="button"
              className="lc-attach"
              title="Quick replies"
              onClick={() =>
                alert("Quick replies coming soon")
              }
            >
              <MessageSquare size={16} />
            </button>

            <input
              placeholder="Type a response..."
              value={message}
              onChange={(e) =>
                updateMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              disabled={selectedChat.status === "Resolved"}
            />

            <button
              type="button"
              className="lc-send"
              onClick={sendMessage}
              disabled={
                !message.trim() ||
                selectedChat.status === "Resolved"
              }
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>

          {/* FOOTER */}
          <footer className="lc-footer">
            <span>
              <ShieldCheck size={12} />
              Demo chat session
            </span>
            <span>OCBC Sense</span>
          </footer>
        </>
      )}
    </section>
  );
}

export default EmbeddedChat;