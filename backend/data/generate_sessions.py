#!/usr/bin/env python3
"""
Synthetic data generator for Ask, Don't Assume (OCBC Ignite, PS4).

Journey: a foreigner opening an account remotely with an e-passport.
Creates fake sessions and events so the Insights tab has realistic data.
No real people: nothing personal is generated, only preferences.

Output (next to this script):
  sessions.json   one document per journey attempt  (source: "synthetic")
  events.json     everything that happened during those attempts

Usage:
  python3 generate_sessions.py                 # 300 sessions, seed 42
  python3 generate_sessions.py --sessions 500 --seed 7
"""
import argparse
import json
import random
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

SGT = timezone(timedelta(hours=8))

# ---------------------------------------------------------------- preferences
def pick(weights):
    """weights: dict value -> weight"""
    return random.choices(list(weights), list(weights.values()))[0]

LANG = {"en": 60, "zh": 25, "ms": 15}
WORDING = {"standard": 80, "simple": 20}
TEXT = {"default": 70, "large": 22, "xlarge": 8}


class Session:
    def __init__(self, n, start):
        self.id = f"syn{n:04d}"
        self.t = start
        self.events = []
        prefs = {"wording": pick(WORDING), "text_size": pick(TEXT),
                 "language": pick(LANG)}
        self.doc = {
            "_id": self.id, "source": "synthetic",
            "started_at": iso(start), "ended_at": None, "outcome": "in_progress",
            "preferences": prefs, "current_preferences": dict(prefs),
        }
        # one optional mid-journey settings change, decided up front
        self.mode_change_step = random.choice([None] * 12 + [2, 3, 4, 5])

    # -- helpers
    def wait(self, lo, hi):
        self.t += timedelta(seconds=random.randint(lo, hi))

    def log(self, page, etype):
        self.events.append({"session_id": self.id, "page_id": page, "type": etype,
                            "source": "synthetic", "time": iso(self.t)})

    def end(self, outcome):
        self.doc["outcome"] = outcome
        self.doc["ended_at"] = iso(self.t)

    # -- help paths
    def handoff(self, page):
        self.log(page, "handoff_request")
        self.wait(10, 90)                    # waiting for staff
        self.log(page, "handoff_accepted")
        self.wait(30, 180)                   # staff helping
        self.log(page, "handoff_resolved")
        return True

    def ask_ai(self, page):
        """Returns True if the applicant ended up helped (by AI or a person)."""
        self.wait(10, 30)
        outcome = pick({"helped": 60, "not_helped": 30, "fallback": 10})
        self.log(page, "ai_question")       # outcome is simulated, not logged
        if outcome == "helped":
            return True
        if random.random() < 0.6:            # "Still stuck → Talk to a person"
            self.wait(5, 15)
            return self.handoff(page)
        return False

    def friction(self, page, trigger, person_bias=0):
        """Log friction (the offer card always appears) and return True if help worked."""
        self.log(page, f"friction:{trigger}")
        self.wait(3, 12)
        choice = pick({"ai": 45, "person": 20 + person_bias, "decline": 35})
        if choice == "decline":
            self.log(page, "offer_declined")
            return False
        self.log(page, "offer_accepted")         # AI or person shows in the events that follow
        return self.ask_ai(page) if choice == "ai" else self.handoff(page)

    def maybe_ask_without_friction(self, page):
        if random.random() < 0.03:           # the always-visible "Ask a question" link
            self.ask_ai(page)

    def maybe_change_setting(self, page, step):
        if step != self.mode_change_step:
            return
        cur = self.doc["current_preferences"]
        r = random.random()
        if r < 0.5:
            new = random.choice([l for l in LANG if l != cur["language"]])
            self.log(page, f"language_change:{new}")
            cur["language"] = new
        elif r < 0.8:
            new = "simple" if cur["wording"] == "standard" else "standard"
            self.log(page, f"wording_change:{new}")
            cur["wording"] = new
        else:
            new = pick({s: (3 if s != "default" else 1) for s in TEXT if s != cur["text_size"]})
            self.log(page, f"text_size_change:{new}")
            cur["text_size"] = new

    def abandon(self, page):
        self.wait(5, 60)
        if random.random() < 0.15:           # tab closed: nothing sent, stays in_progress
            return
        self.log(page, "journey_abandon")
        self.end("abandoned")

    # ------------------------------------------------------------ steps
    def view(self, page):
        self.wait(2, 6)
        self.log(page, "page_view")

    def step1(self):
        p = "account.step1"; self.view(p)
        if random.random() < 0.05:
            self.wait(45, 80); self.friction(p, "long_pause")
        self.maybe_ask_without_friction(p)
        self.wait(15, 40)
        if random.random() < 0.06:           # not eligible
            code = pick({"COUNTRY_NOT_SUPPORTED": 75, "AGE_REQUIREMENT": 25})
            self.log(p, f"error:{code}")
            if random.random() < 0.3:
                self.wait(5, 15); self.handoff(p)
            self.wait(5, 20); self.end("not_eligible")
            return False
        return True

    def step2(self):
        p = "account.step2"; self.view(p)
        if random.random() < 0.08:
            self.wait(45, 90); self.friction(p, "long_pause")
        self.maybe_change_setting(p, 2)
        self.maybe_ask_without_friction(p)
        self.wait(15, 40)
        if random.random() < 0.08:
            self.log(p, "error:CHECKLIST_INCOMPLETE")
            self.wait(10, 30)
        if random.random() < 0.03:
            self.abandon(p); return False
        return True

    def step3(self):
        """Passport NFC scan: the hardest step."""
        p = "account.step3"; self.view(p)
        self.maybe_change_setting(p, 3)
        if random.random() < 0.10:
            self.wait(45, 90)
            helped = self.friction(p, "long_pause")
        else:
            helped = False
        no_nfc = random.random() < 0.05          # phone can't read chips at all
        fails_in_a_row = 0
        for attempt in range(6):
            self.wait(20, 50)
            success_p = 0.75 if helped else 0.50
            if no_nfc and not helped:
                success_p = 0.0
            if random.random() < success_p:
                self.wait(5, 15)
                return True
            code = "NFC_NOT_SUPPORTED" if no_nfc else pick({"NFC_READ_FAILED": 58, "NFC_CHIP_NOT_FOUND": 42})
            self.log(p, f"error:{code}")
            fails_in_a_row += 1
            if fails_in_a_row % 2 == 0:          # every 2 failures → friction + offer
                helped = self.friction(p, "repeated_errors", person_bias=10) or helped
                if helped and no_nfc:
                    no_nfc = False           # staff suggested another phone
            if fails_in_a_row >= 3 and not helped and random.random() < 0.60:
                self.abandon(p); return False
        self.abandon(p); return False

    def step4(self):
        p = "account.step4"; self.view(p)
        self.maybe_change_setting(p, 4)
        self.maybe_ask_without_friction(p)
        fails = 0
        for attempt in range(4):
            self.wait(25, 60)
            if random.random() < 0.85:
                return True
            self.log(p, "error:" + pick({"ID_UNREADABLE": 60, "VERIFICATION_FAILED": 40}))
            fails += 1
            if fails % 2 == 0:
                self.friction(p, "repeated_errors")
        self.abandon(p); return False

    def step5(self):
        """Supporting documents: unclear requirements."""
        p = "account.step5"; self.view(p)
        self.maybe_change_setting(p, 5)
        helped = False
        if random.random() < 0.14:           # unsure which documents qualify
            self.wait(20, 60)                # goes back twice (counted in the browser, not logged)
            helped = self.friction(p, "back_and_forth")
        elif random.random() < 0.10:
            self.wait(45, 100)
            helped = self.friction(p, "long_pause")
        self.maybe_ask_without_friction(p)
        fails = 0
        for attempt in range(4):
            self.wait(40, 120)
            if random.random() < (0.85 if helped else 0.75):
                break
            self.log(p, "error:" + pick({"DOC_UNREADABLE": 45, "DOC_WRONG_TYPE": 33, "DOC_MISSING": 22}))
            fails += 1
            if fails % 2 == 0:
                helped = self.friction(p, "repeated_errors") or helped
        else:
            self.abandon(p); return False
        if random.random() < (0.03 if helped else 0.07):
            self.abandon(p); return False
        return True

    def step6(self):
        p = "account.step6"; self.view(p)
        if random.random() < 0.05:
            self.wait(45, 80); self.friction(p, "long_pause")
        self.maybe_ask_without_friction(p)
        self.wait(30, 70)
        if random.random() < 0.10:
            self.log(p, "error:DECLARATION_REQUIRED"); self.wait(10, 20)
        if random.random() < 0.02:
            self.abandon(p); return False
        return True

    def run(self):
        for step in (self.step1, self.step2, self.step3, self.step4, self.step5, self.step6):
            if not step():
                return
        self.wait(3, 8)
        self.end("submitted")                 # POST /api/applications
        self.log("account.submitted", "journey_complete")


# ---------------------------------------------------------------- utilities
def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def random_start(first_day, days):
    """Mostly evenings and lunchtime, Singapore time."""
    day = first_day + timedelta(days=random.randrange(days))
    hour = random.choices(range(8, 24), weights=[2, 3, 3, 3, 5, 5, 3, 3, 3, 4, 6, 7, 7, 6, 4, 2])[0]
    return datetime(day.year, day.month, day.day, hour, random.randrange(60), random.randrange(60), tzinfo=SGT)


def summary(sessions, events):
    out = Counter(s["outcome"] for s in sessions)
    print(f"Sessions: {len(sessions)}   Events: {len(events)}")
    print("Outcomes:", dict(out))
    eligible = len(sessions) - out["not_eligible"]
    print(f"Submission rate (excluding not eligible): {out['submitted'] / eligible:.0%}")
    reached = {}
    for e in events:
        if e["type"] == "page_view":
            reached.setdefault(e["page_id"], set()).add(e["session_id"])
    print("Funnel:", ", ".join(f"{p.split('.')[-1]}={len(reached.get(p, ()))}" for p in
                               [f"account.step{i}" for i in range(1, 7)]), f"submitted={out['submitted']}")
    types = Counter(e["type"] for e in events)
    fr = Counter((e["page_id"].split(".")[-1], e["type"]) for e in events if e["type"].startswith("friction:"))
    print("Friction:", dict(sorted(fr.items())))
    print("Errors:", {t: n for t, n in types.most_common() if t.startswith("error:")})
    print("Offers:", {t: n for t, n in types.items() if t.startswith("offer_")},
          " Hand-offs:", types["handoff_request"])
    print("Accepted offers by what followed:", dict(offer_followups(events)))
    print("After the AI:", dict(ai_followups(events)))


def ai_followups(events):
    """After each ai_question: did the applicant move on, or were they still stuck?"""
    result = Counter()
    by_session = {}
    for e in events:
        by_session.setdefault(e["session_id"], []).append(e)
    for es in by_session.values():
        for i, e in enumerate(es):
            if e["type"] != "ai_question":
                continue
            verdict = "no next step (tab closed)"
            for n in es[i + 1:]:
                if n["type"] == "journey_complete" or (n["type"] == "page_view" and n["page_id"] != e["page_id"]):
                    verdict = "moved on"; break
                if n["type"] in ("handoff_request", "journey_abandon") or n["type"].startswith("friction:"):
                    verdict = "still stuck"; break
            result[verdict] += 1
    return result


def offer_followups(events):
    """After each offer_accepted, what help did the applicant actually use (until the next friction)?"""
    result = Counter()
    by_session = {}
    for e in events:
        by_session.setdefault(e["session_id"], []).append(e["type"])
    for types in by_session.values():
        for i, t in enumerate(types):
            if t != "offer_accepted":
                continue
            after = []
            for nxt in types[i + 1:]:
                if nxt.startswith("friction:"):
                    break
                after.append(nxt)
            if "handoff_accepted" in after:
                result["reached a person"] += 1
            elif "ai_question" in after:
                result["AI only"] += 1
            else:
                result["no help used"] += 1
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions", type=int, default=300)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--start", default="2026-11-01", help="first day (Singapore time)")
    ap.add_argument("--days", type=int, default=19)
    a = ap.parse_args()
    random.seed(a.seed)

    first = datetime.fromisoformat(a.start)
    starts = sorted(random_start(first, a.days) for _ in range(a.sessions))
    sessions, events = [], []
    for n, st in enumerate(starts, 1):
        s = Session(n, st)
        s.run()
        sessions.append(s.doc)
        events.extend(s.events)

    here = Path(__file__).parent
    (here / "sessions.json").write_text(json.dumps(sessions, indent=1))
    (here / "events.json").write_text(json.dumps(events, indent=1))
    summary(sessions, events)


if __name__ == "__main__":
    main()
