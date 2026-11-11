import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./GuidedTour.css";
import { usePreferences } from "../context/PreferencesContext";
import { useHelp } from "../context/HelpContext";
import useT from "../i18n/useT";

/*
  GuidedTour: Guided layout only.

  It is not a multi-step tour. Each render it picks the FIRST step whose
  `when` is true, highlights that one element with Driver.js and shows the
  translated guidance text beside it. When page state changes (the user picks
  a country, the form becomes valid, a result arrives...) a different step
  becomes current and the highlight moves on by itself.

    <GuidedTour steps={[
      { id: "country", target: "#country", when: !country, guidanceKey: "s1.guidance.country" },
      ...
    ]} />

*/

const MAX_FRAMES = 60; // ~1s of waiting for a conditional element to appear

let active = null; // only one Driver instance can exist at a time

function destroyActive() {
  if (active) {
    active.quiet = true;
    try {
      active.driver.destroy();
    } catch {
      /* already destroyed */
    }
    active = null;
  }
}

const isVisible = (el) => el.getClientRects().length > 0;

export default function GuidedTour({ steps }) {
  const { prefs } = usePreferences();
  const { level, helpOpen } = useHelp();
  const { tw } = useT();
  const dismissed = useRef(new Set());

  // Only an open AskSense sheet pauses it.
  const enabled = (prefs.layout === "guided" || level >= 1) && !helpOpen;
  const current = enabled ? steps.find((s) => s.when) : undefined;

  // Primitives only, so the effect does not re-run on every render.
  const id = current?.id;
  const target = current?.target;
  const text = current?.guidanceKey ? tw(current.guidanceKey) : "";
  const side = current?.side ?? "bottom";

  useEffect(() => {
    if (!id || !target || dismissed.current.has(id)) return undefined;

    let cancelled = false;
    let frame = 0;
    let waited = 0;
    let mine = null;

    const show = () => {
      if (cancelled) return;
      const el = document.querySelector(target);
      if (!el || !isVisible(el)) {
        if (waited++ < MAX_FRAMES) frame = requestAnimationFrame(show);
        return;
      }

      destroyActive();
      const previousFocus = document.activeElement;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const d = driver({
        animate: !reduceMotion,
        smoothScroll: !reduceMotion,

        allowClose: true,
        showButtons: ["close"],

        /*
    The highlighted element AND the rest of the page
    should remain interactive.
  */
        disableActiveInteraction: false,

        overlayColor: "#000",
        overlayOpacity: 0.2,

        stagePadding: 6,
        stageRadius: 12,

        popoverClass: "guided-popover",
        onDestroyed: () => {
          if (mine && !mine.quiet) dismissed.current.add(id);
          if (active === mine) active = null;
        },
      });
      mine = { driver: d, quiet: false };
      active = mine;

      d.highlight({
        element: el,
        popover: text ? { description: text, side, align: "start" } : undefined,
      });

      // Driver moves focus into its popover. Give it back so someone who is
      // typing or using a keyboard / screen reader keeps their place.
      requestAnimationFrame(() => {
        if (
          !cancelled &&
          previousFocus instanceof HTMLElement &&
          previousFocus.isConnected &&
          previousFocus !== document.body
        ) {
          previousFocus.focus({ preventScroll: true });
        }
      });
    };

    frame = requestAnimationFrame(show);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (mine) {
        mine.quiet = true;
        if (active === mine) active = null;
        try {
          mine.driver.destroy();
        } catch {
          /* already destroyed */
        }
      }
    };
  }, [id, target, text, side]);

  return null;
}
