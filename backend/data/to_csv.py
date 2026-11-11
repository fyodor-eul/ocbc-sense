#!/usr/bin/env python3
"""
Convert the demo data (JSON) into CSV files, one per collection.

Nested fields are flattened into their own columns:
  pages:    text.standard        -> text_standard
            suggested_questions  -> one column, questions separated by " | "
  sessions: preferences.language -> preferences_language (same for current_preferences)
  events:   already flat (session_id, page_id, type, source, time)

Usage (from the data folder):
  python3 to_csv.py            # writes csv/pages.csv, csv/sessions.csv, csv/events.csv
"""
import csv
import json
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "csv"
PREF_KEYS = ["wording", "text_size", "language"]


def load(path):
    return json.loads(Path(path).read_text())


def write(name, columns, rows):
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        w.writerows(rows)
    print(f"{name}: {len(rows)} rows")


def blank(v):
    return "" if v is None else v


def main():
    OUT.mkdir(exist_ok=True)

    pages = load(HERE / "pages.json")
    write("pages.csv",
          ["_id", "step_no", "title", "text_standard", "text_simple", "verified_info", "suggested_questions"],
          [{"_id": p["_id"], "step_no": blank(p["step_no"]), "title": p["title"],
            "text_standard": p["text"]["standard"], "text_simple": p["text"]["simple"],
            "verified_info": blank(p["verified_info"]),
            "suggested_questions": " | ".join(p["suggested_questions"])} for p in pages])

    sessions = load(HERE / "sessions.json")
    cols = ["_id", "source", "started_at", "ended_at", "outcome"] \
        + [f"preferences_{k}" for k in PREF_KEYS] + [f"current_preferences_{k}" for k in PREF_KEYS]
    rows = []
    for s in sessions:
        r = {k: blank(s[k]) for k in cols[:5]}
        for k in PREF_KEYS:
            r[f"preferences_{k}"] = s["preferences"][k]
            r[f"current_preferences_{k}"] = s["current_preferences"][k]
        rows.append(r)
    write("sessions.csv", cols, rows)

    events = load(HERE / "events.json")
    write("events.csv", ["session_id", "page_id", "type", "source", "time"], events)


if __name__ == "__main__":
    main()
