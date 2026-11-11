import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { PreferencesProvider } from "./context/PreferencesContext";
import { JourneyProvider, useJourney } from "./context/JourneyContext";
import { HelpProvider } from "./context/HelpContext";
import { PresenterProvider } from "./context/PresenterContext";
import PresenterPanel from "./components/PresenterPanel";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import PrefsTextLanguage from "./pages/PrefsTextLanguage";
import PrefsWording from "./pages/PrefsWording";
import PrefsSaved from "./pages/PrefsSaved";
import SignUp from "./pages/SignUp";
import Step1 from "./pages/Step1";
import Step2 from "./pages/Step2";
import Step3 from "./pages/Step3";
import Step4 from "./pages/Step4";
import Step5 from "./pages/Step5";
import Step6 from "./pages/Step6";
import Submitted from "./pages/Submitted";
import WhatNext from "./pages/WhatNext";
import Home from "./pages/Home";
import Placeholder from "./pages/Placeholder";
import DesignSystem from "./pages/DesignSystem";
import Settings from "./pages/Settings";

function StepRoute() {
  const { n } = useParams();
  const step = Number(n);
  const { sessionId, eligibility, checklist, done } = useJourney();

  if (!sessionId) return <Navigate to="/signup" replace />;
  if (step === 1) return <Step1 />;
  // After a refresh the entered details are gone, so go back to Step 1.
  if (!eligibility?.eligible) return <Navigate to="/step/1" replace />;
  if (step === 2) return <Step2 />;
  if (!Object.values(checklist).every(Boolean))
    return <Navigate to="/step/2" replace />;
  if (step === 3) return <Step3 />;
  if (!done.nfc) return <Navigate to="/step/3" replace />;
  if (step === 4) return <Step4 />;
  if (!done.face) return <Navigate to="/step/4" replace />;
  if (step === 5) return <Step5 />;
  if (!done.doc) return <Navigate to="/step/5" replace />;
  if (step === 6) return <Step6 />;
  return <Navigate to="/step/1" replace />;
}

export default function App() {
  return (
    <PreferencesProvider>
      <JourneyProvider>
        <PresenterProvider>
          <BrowserRouter>
            <HelpProvider>
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/preferences/1" element={<PrefsTextLanguage />} />
                <Route path="/preferences/2" element={<PrefsWording />} />
                <Route path="/preferences/saved" element={<PrefsSaved />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/login"
                  element={
                    <Placeholder
                      title="Log in"
                      message="Log in isn’t part of this demo. Please create a new account."
                    />
                  }
                />
                <Route path="/step/:n" element={<StepRoute />} />
                <Route path="/submitted" element={<Submitted />} />
                <Route path="/next" element={<WhatNext />} />
                <Route path="/home" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/design-system" element={<DesignSystem />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <PresenterPanel />
            </HelpProvider>
          </BrowserRouter>
        </PresenterProvider>
      </JourneyProvider>
    </PreferencesProvider>
  );
}
