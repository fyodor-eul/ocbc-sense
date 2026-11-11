import { useEffect } from "react";
import { useJourney } from "../context/JourneyContext";
import { logEvent } from "../api/client";

// Remembers the last journey page, so Settings can say which page a change was made on.
let lastPage = null;
export function getLastPage() {
  return lastPage;
}

export default function usePageView(pageId) {
  const { sessionId } = useJourney();
  useEffect(() => {
    lastPage = pageId;
    if (sessionId) logEvent(sessionId, pageId, "page_view");
  }, [sessionId, pageId]);
}
