
export const applicants = [
  {
    id: "491",
    sessionId: "SES-7821",
    phone: "5---7988",
    step: 3,
    stepName: "Scan passport chip (NFC)",
    time: "Just now",
    status: "Action failed twice",
    detail: "Viewing details",
    callStatus: "Pick Up Chat",
    inactivity: "01:18",
    failedAttempts: 2,
    lastInteraction: "—",
    error: "NFC_TIMEOUT",
    events: [
      {
        time: "14:24:12",
        type: "error",
        message: "Second passport chip scan failed",
        code: "NFC_TIMEOUT"
      },
      {
        time: "14:23:45",
        type: "warning",
        message: "First passport chip scan failed",
        code: "NFC_TIMEOUT"
      },
      {
        time: "14:22:54",
        type: "success",
        message: "Passport chip scan opened"
      }
    ]
  },
  {
    id: "488",
    sessionId: "SES-7822",
    phone: "1---142C",
    step: 2,
    stepName: "Get ready",
    time: "1m ago",
    status: "No input for 45s",
    inactivity: "00:45",
    failedAttempts: 0,
    lastInteraction: "—",
    events: []
  },
  {
    id: "485",
    sessionId: "SES-7823",
    phone: "5---890F",
    step: 5,
    stepName: "Supporting documents",
    time: "3m ago",
    status: "Back used twice",
    inactivity: "00:32",
    failedAttempts: 0,
    lastInteraction: "Back navigation",
    events: []
  },
  {
    id: "479",
    sessionId: "SES-7824",
    phone: "3---C53A",
    step: 3,
    stepName: "Scan passport chip (NFC)",
    time: "5m ago",
    status: "No input for 45s",
    inactivity: "00:45",
    failedAttempts: 0,
    lastInteraction: "—",
    events: []
  }
];

export const onboardingSteps = [
  "Eligibility",
  "Get ready",
  "Scan chip (NFC)",
  "Verify you",
  "Documents",
  "Review & Submit"
];