
import { useState } from "react";

import Navbar from "./components/Navbar";
import FrictionQueue from "./pages/FrictionQueue";
import EscalatedHelp from "./pages/EscalatedHelp";

import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("friction");

  // Continue on the Escalated tab: open that applicant's chat in the Friction Queue
  const [focus, setFocus] = useState(null);

  const openChat = (sessionId) => {
    setFocus({ sessionId });
    setActiveTab("friction");
  };

  return (
    <div className="app">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="dashboard-content">
        <div
          style={{
            display: activeTab === "friction"
              ? "block"
              : "none"
          }}
        >
          <FrictionQueue focus={focus} />
        </div>

        {activeTab === "escalated" && (
          <EscalatedHelp onOpenChat={openChat} />
        )}
      </main>
    </div>
  );
}

export default App;