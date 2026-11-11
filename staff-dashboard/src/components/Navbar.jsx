
import "./Navbar.css";
import { Bell, CircleHelp, Wifi } from "lucide-react";

function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="navbar">
      <div className="navbar-top">
        <div className="navbar-brand">
          <h2 className="ocbc-logo">OCBC</h2>
          <div className="brand-details">
            <strong>Digital Onboarding Assist</strong>
            <span>STAFF OPERATIONS</span>
          </div>
        </div>

        <div className="navbar-status">
          <span className="live-status">
            <Wifi size={14} />
            Live Sessions Active
          </span>

          <span className="audio-status">
            <Bell size={14} />
            Audio Alerts: Active
          </span>

          <CircleHelp size={18} />

          <div className="staff-profile">
            <div className="staff-avatar">SL</div>
            <div>
              <strong>Sherry Lim</strong>
              <small>Customer Support Executive</small>
            </div>
          </div>
        </div>
      </div>

      <nav className="navbar-tabs">
        <button
          className={activeTab === "friction" ? "tab active" : "tab"}
          onClick={() => setActiveTab("friction")}
        >
          Live Friction Queue
        </button>

        <button
          className={activeTab === "escalated" ? "tab active" : "tab"}
          onClick={() => setActiveTab("escalated")}
        >
          Escalated to Staff Help
        </button>
      </nav>
    </header>
  );
}

export default Navbar;