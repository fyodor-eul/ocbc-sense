# Ask, Don't Assume — Testing the Backend with Postman

`ask-dont-assume.postman_collection.json` holds 23 REST requests with built-in tests. Socket.IO can't be saved in a collection file, so section 4 shows how to set it up by hand in Postman.

---

## 1. Before you start

1. Start the backend: `docker compose up -d --build` (see `backend-setup.md`).
2. Load the demo data: `docker compose exec backend node seed.js`.

---

## 2. Import the collection

1. Postman → **Import** → drop in `ask-dont-assume.postman_collection.json`.
2. Open the collection → **Variables** tab. Check `baseUrl`:
   - `http://localhost:3000` on Laptop A
   - `http://<laptop-a-ip>:3000` from another laptop

`session_id` and `session_id_2` fill themselves in when you run the requests that create sessions.

---

## 3. Run the REST requests

**All at once:** right-click the collection → **Run collection** → **Run**. All tests should pass (about 50; the hand-off list adds one check per row).

**For a demo,** send them one by one in folder order:

| Folder | What it shows |
|---|---|
| **1. Dashboard** | Friction per page from the synthetic data. Totals only, never individual applicants |
| **2. Eligibility** | One eligible and two not-eligible checks. Nothing is stored |
| **3. Journey (run in order)** | Start a session → change wording mid-journey → submit → submitting again is rejected |
| **4. Leaving early** | A second session that the applicant abandons |
| **5. Validation** | Bad input refused: unsupported language, `submitted` via PATCH, unknown sessions. The last request shows that a passport country sent by mistake is never stored |
| **6. AI** | A question on step 3 in Chinese and simple wording. Without the AI service you get `"fallback": true`, which still passes |
| **7. Chat** | A session's saved chat messages (`GET /api/sessions/:id/messages`). Empty until there's been a chat; checks no ID number is stored unmasked. Then **Hand-offs (Escalated tab)**: `GET /api/handoffs?limit=10`, one row per session that asked for help, live ones first |
| **8. Hand-off demo** | The help-request flow, together with a Socket.IO tab: start a session → send `handoff:request` → check it reached the Escalated tab. See §4.4 |

Each request has a short description, and the **Test Results** tab shows what was checked.

**Show the data in MongoDB afterwards:**
```bash
docker compose exec mongo mongosh askdontassume --eval 'db.sessions.find({ source: "live" })'
```
The sessions have only preferences, outcome and times: no passport country, no age.

---

## 4. Socket.IO (set up by hand)

Postman can send Socket.IO messages, but they're saved in your workspace, not in the collection file. You'll need two Socket.IO tabs: one for the **console** and one for the **applicant**.

### 4.1 Console tab

1. **New → Socket.IO.** URL: `http://localhost:3000` → **Connect**.
2. In the **Events** tab, add listeners for `insights:update`, `handoff:queue`, `handoff:new`, `handoff:taken`, `handoff:reply` and `handoff:resolved`.
3. Send event `join_console` with no message.

### 4.2 Applicant tab

1. **New → Socket.IO.** Same URL → **Connect**.
2. Add listeners for `handoff:accepted`, `handoff:message`, `handoff:reply`, `handoff:history` and `handoff:resolved`.
3. Get a session ID first: run **3. Journey → Start session** and copy `session_id` from the response (or the collection variables).
4. Send `join_session` with `{ "session_id": "<id>" }`.

### 4.3 Things to send

**Log events** from the applicant tab. Event name `event`, message type JSON, and turn on **Ack** so you see the server's reply:

| Message | Expected ack |
|---|---|
| `{ "session_id": "<id>", "page_id": "account.step3", "type": "error:NFC_READ_FAILED" }` | `{ "ok": true }` |
| `{ "session_id": "<id>", "page_id": "account.step3", "type": "friction:repeated_errors" }` | `{ "ok": true }` |
| `{ "session_id": "<id>", "page_id": "account.step3", "type": "text_size_change:large" }` | `{ "ok": true }` |
| `{ "session_id": "<id>", "page_id": "account.step3", "type": "handoff_request" }` | `{ "ok": false, "error": "unknown_type" }`: server-only type |
| `{ "session_id": "s0_0", "page_id": "account.step3", "type": "page_view" }` | `{ "ok": false, "error": "unknown_session" }` |
| `{ "session_id": "<id>", "type": "page_view" }` | `{ "ok": false, "error": "invalid_event" }`: missing `page_id` |

After each saved event, the **console tab receives `insights:update`**. Send **1. Dashboard → Friction per page** again, and the step 3 count has gone up by one.

**Hand-off and chat** (turn on **Ack** for each):
1. **Applicant tab:** send `handoff:request`:
   ```json
   { "session_id": "<id>", "page_id": "account.step3", "share": { "step_no": 3, "step_title": "Scan your passport chip", "last_error": "NFC_READ_FAILED" } }
   ```
   Ack: `{ "ok": true, "handoff_no": 1, "staff_online": 1 }`. The **console tab** receives `handoff:new`.
2. **Console tab:** `handoff:accepted` `{ "session_id": "<id>", "staff_name": "Sherry Lim" }`. The applicant gets "accepted"; consoles get `handoff:taken`.
3. **Console tab:** `handoff:message` `{ "session_id": "<id>", "text": "Try removing your phone case." }`. **Both tabs** receive it.
4. **Applicant tab:** `handoff:reply` `{ "session_id": "<id>", "text": "Still failing, passport A1234567" }`. Both tabs receive it, with the number as `[hidden]`.
5. **Show the refresh:** disconnect and reconnect the applicant tab, then send `join_session` again. It receives `handoff:history` with both messages.
6. **Console tab:** `handoff:resolved` `{ "session_id": "<id>" }`. Both tabs receive it.
7. **Postman REST:** `GET {{baseUrl}}/api/sessions/<id>/messages` returns the saved transcript, and **7. Chat → Hand-offs** shows the session at the top with `"status": "resolved"`. Run **3. Journey → Submit application** for it and send Hand-offs again: `outcome` is now `submitted` (the console tab also gets `insights:update`).

**Try the errors:** pick up twice (`already_taken`), send a message before picking up (`not_picked_up`), or request help again while one is open (`already_open`).

### 4.4 Demo: help request → dashboard

What you're showing:
```
handoff:request ──► 1. saved in events
                    2. added to the open queue
                    3. handoff:new ──────► Live Friction Queue: new card
                    4. insights:update ──► Escalated tab reloads GET /api/handoffs
                                           → row in "Pending": Waiting…
```

**Set up**
- **Dashboard, two browser windows:**
  - Window A on **Live Friction Queue**.
  - Window B on **Escalated to Staff Help**, with DevTools → Network filtered to `handoffs`.
- **Postman:** the console tab from §4.1 (listeners on `handoff:new` and `insights:update`, then `join_console`).

**Run it**
1. Send **8. Hand-off demo → Start a session for the demo**. The ID is saved as `{{session_id_demo}}`, and the Console prints the messages below with it filled in.
2. In the **applicant tab**, send `join_session`:
   ```json
   { "session_id": "{{session_id_demo}}" }
   ```
3. *Optional, so the card shows the error tag:* send `event` twice:
   ```json
   { "session_id": "{{session_id_demo}}", "page_id": "account.step3", "type": "error:NFC_READ_FAILED" }
   ```
4. Send `handoff:request` (Ack on):
   ```json
   { "session_id": "{{session_id_demo}}", "page_id": "account.step3",
     "share": { "step_no": 3, "step_title": "Scan your passport chip", "last_error": "NFC_READ_FAILED", "failed_attempts": 2 } }
   ```
   Ack: `{ "ok": true, "handoff_no": 1, "staff_online": … }`. `staff_online` counts every connected dashboard, including the Postman console tab.
5. **Show the four results:**

   | | Where |
   |---|---|
   | 1. Saved in `events` | `docker compose exec mongo mongosh askdontassume --eval 'db.events.find({ type: "handoff_request" }).sort({ time: -1 }).limit(1)'` |
   | 2. Open queue | Refresh Window A: the card is still there (loaded from `handoff:queue`) |
   | 3. `handoff:new` | Window A: new card. Console tab: the payload, with no passport data |
   | 4. `insights:update` | Console tab receives it; Window B: a new `handoffs` request in Network and the row at the top of Pending |

6. Send **8. Hand-off demo → Check: the request reached the Escalated tab**. Its tests confirm the row: `in_progress`, step 3, status `waiting`.

**Optional:** click **Pick Up Chat** in Window A. Window B's row changes to "With staff", and the check request now reports `active`.

**Each run needs a new session.** Send **Start a session for the demo** again, because a second request while one is open gets `already_open`. If the variable doesn't fill in inside the Socket.IO tab, paste the ID from the Console instead.

---

## 5. Without Postman

The same REST tests run from the terminal with Newman:
```bash
npx newman run ask-dont-assume.postman_collection.json
# or against another laptop:
npx newman run ask-dont-assume.postman_collection.json --env-var baseUrl=http://172.20.10.4:3000
```
For Socket.IO, `node test-client.js <session_id>` does the whole hand-off and chat automatically (see `backend-setup.md`).
