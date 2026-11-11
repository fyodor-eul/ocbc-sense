# Ask, Don't Assume — Demo Data

All data is **synthetic**. No real people, passports or documents.

## Files

| File | Contents | Loaded into |
|---|---|---|
| `pages.json` | 10 pages: text in both wording levels, `verified_info`, `suggested_questions` | MongoDB `pages` |
| `sessions.json` | 300 synthetic journey attempts (`source: "synthetic"`) | MongoDB `sessions` |
| `events.json` | 3,439 events from those attempts (`type` is `category` or `category:value`, e.g. `error:NFC_READ_FAILED`) | MongoDB `events` |
| `generate_sessions.py` | Regenerates `sessions.json` and `events.json` | – |

## Load into MongoDB

From the `backend` folder, with MongoDB running:

```bash
node seed.js
```

This **replaces** the `pages`, `sessions` and `events` collections (including any live demo sessions) and creates the indexes. Run it again any time to reset the demo data.

## Regenerate

```bash
python3 data/generate_sessions.py                      # 300 sessions, seed 42 (same data every time)
python3 data/generate_sessions.py --sessions 500       # more sessions
python3 data/generate_sessions.py --seed 7             # different random data
```

No extra Python packages needed. It prints a summary when done.

## What the data shows (seed 42)

| | |
|---|---|
| Sessions | 300 (1–19 Nov 2026) |
| Outcomes | 245 submitted · 35 abandoned · 15 not eligible · 5 in progress (tab closed) |
| Submission rate | 86% (excluding not eligible) |
| Funnel | Step 1: 300 → Step 2: 285 → Step 3: 279 → Step 4: 267 → Step 5: 267 → Step 6: 248 → Submitted: 245 |
| Most friction | **Step 3, passport scan:** 115 of 251 friction events, mostly `friction:repeated_errors` (89) |
| Most drop-off | **Step 5, supporting documents:** 19 applicants lost |
| Top errors | `error:NFC_READ_FAILED` (129), `error:NFC_CHIP_NOT_FOUND` (101), `error:DOC_UNREADABLE` (41) |
| Offer card | Shown 251 times (once per friction): 176 accepted · 75 said no thanks. Of those accepted: 98 reached a person, 78 used the AI only |
| After the AI | 155 answers: 104 moved on to the next step · 49 still stuck (hand-off, new friction or left) · 2 tab closed |
| Hand-offs | 109 |
| Mid-journey setting changes | Language 30 · wording 23 · text size 24 |

Two insights for the pitch:
1. **The passport scan causes the most friction and hand-offs,** but help usually gets applicants through.
2. **Supporting documents lose the most applicants,** which suggests the requirements need explaining more clearly.

## How it was built

Each session walks through the six steps with realistic chances of:
- Not being eligible on step 1 (~6%)
- NFC scan failures on step 3 (most common), ID problems on step 4, document problems on step 5
- Long pauses and back-and-forth (especially on step 5)
- The offer card on every friction: Ask a question, Talk to a person, or No thanks. Friction from repeated errors fires every 2 failures
- AI answers, logged as one `ai_question` event. Whether they helped shows in what happens next (moving on, or a hand-off)
- Changing language, wording or text size mid-journey (applicant's own choice)
- Leaving mid-journey, sometimes by closing the tab (stays `in_progress`)

Preferences (including language) are chosen at random and **independently of everything else**, matching the rule that nothing about the applicant is inferred.

The data was checked for consistency: events stay within their session's start and end, every friction has one offer response, submitted sessions have `journey_complete`, ineligible sessions stop at step 1, and no personal fields appear anywhere.
