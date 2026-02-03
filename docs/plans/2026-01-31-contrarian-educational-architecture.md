# Contrarian / Educational Architecture (Proposed)

**Date:** 2026-01-31  
**Status:** Implemented (API routing, stance detection, confirmation flow, stance button, CTAs)

---

## 1. End Goals

### Educational flow
- **Success:** User has a stance and can articulate it.
- **Articulation flow (A):** The user articulates in chat first — they type their stance or build it over several messages. When ready, they click the explicit-action button; we use that chat content (e.g. last message(s)) as their stated stance. We do **not** assume that any single typed message is their stance until they perform the explicit action (see §2).

### Contrarian flow
- **Success:** The following are all valid successful outcomes from the user’s perspective:
  1. **Strengthen understanding** — User deepens their understanding of their own stance.
  2. **Change stance** — User revises their view (e.g. after seeing challenging stats or legislation).
  3. **Learn about legislation** — User learns about proposed legislation that supports or opposes their stance.
  4. **Informed and take action** — User is informed about the current state of the topic and chooses to take action to promote their stance.
- **Surfacing (C — explicit):** The product **explicitly** surfaces these outcomes: e.g. an **end-of-flow summary** (“You explored your stance, saw X bills…”) and/or **clear CTAs** for “Learn legislation,” “Take action” (links, prompts, or next steps). The architecture must support returning or exposing the right data (e.g. legislation shown, topics covered) so the UI can render summaries and CTAs.

---

## 2. Explicit Action to State a Stance (Option A)

### Primary path: dedicated UI control
- There is a **dedicated UI control**, e.g. a button: **“I have a stance — challenge me”** (or “I’m ready to state my stance”).
- The user may have already typed their view in the chat; the **explicit action** is **clicking that button**.
- When the user clicks it, we treat their **last message(s)** (or a designated “stance” message) as their stated stance and **switch to the contrarian path** (fetch gov data, generate challenge with optional stats, etc.).

### Fallback: typed stance without clicking
- If the user **types** something that looks like a stance (we detect it) but **does not** click the button, we **do not** assume it is their stance.
- Instead we **prompt for confirmation** with an educational-style response, e.g.:
  - *“It sounds like you might have a stance on [topic]. Is [paraphrased stance] your current stance? If yes, click ‘I have a stance — challenge me’ to get a challenge; if not, we can keep exploring.”*
- **If the user says yes** (e.g. “yes,” “that’s right,” “correct”) → treat that as **explicit confirmation** → switch to contrarian using the detected stance (same as if they had clicked the button with that text).
- **If the user says no** (e.g. “no,” “not quite,” “I was just thinking out loud”) → **stay in educational flow**; continue with analysis + next question, no contrarian.

So:
- **Explicit action** = either (1) click “I have a stance — challenge me,” or (2) confirm “yes” when we ask “Is X your current stance?”
- We never treat unsolicited typed text as a stance unless the user confirms.

---

## 3. Conversation Mode and Transitions

### Modes
- **Educational** — Helping the user discover and articulate a stance (common stances, origination, values at stake; question ladder: yes/no → open-ended). No stats/legislation sections. No assumption that chat text is their stance.
- **Contrarian** — User has stated a stance (via button or confirmation). We acknowledge, optionally show supporting/challenging stats and legislation when we have direct matches, analyze, and ask a probing question. Success outcomes: strengthen understanding, change stance, learn legislation, take action.

### Who holds mode
- **Client sends `mode`** in the request: `educational` | `contrarian`, derived from the **last response type** (`type: 'educational'` or `type: 'challenge'`). No server-side session required.

### Transitions
- **→ Contrarian:**  
  - User clicks “I have a stance — challenge me” (we use last message(s) as stance), **or**  
  - User confirms “yes” when we ask “Is X your current stance?” (we use the previously detected stance).
- **→ Educational:**  
  - First message in topic (no stance yet), **or**  
  - User said “no” to “Is X your current stance?” (stay educational).

### Stance detection (educational only)
- When **mode = educational** and we receive a **text message** (not a button click), we may run a **stance detector** (heuristic or one cheap LLM call): “Does this message state a substantive stance on the topic?”
- If **no** → normal educational response (analysis + next question).
- If **yes** → we do **not** switch to contrarian yet. We return a **confirmation prompt** (educational-type response) that asks “Is [paraphrase] your current stance?” and optionally surface the “I have a stance — challenge me” button again.
- Next user message: if affirmative → treat as explicit action, switch to contrarian; if negative → stay educational.

---

## 4. Request Shape and API Contract

### Client sends (e.g. to `/api/contrarian/challenge`)
- `topic`, `conversationHistory`, `currentScores`
- `userStance` — latest user message text (or the designated “stance” text when the user clicked the button).
- `mode` — `'educational'` | `'contrarian'` (from last response type).
- `explicitStanceAction` — boolean: `true` when the user **clicked** “I have a stance — challenge me” (so we treat `userStance` as stated stance and run contrarian regardless of detection).

### Backend behavior (high level)
- If `explicitStanceAction === true` → **contrarian path** (use `userStance` as stance).
- Else if `mode === 'contrarian'` → **contrarian path** (e.g. follow-up in contrarian flow).
- Else (`mode === 'educational'`):
  - Run **stance detection** on `userStance`.
  - If **no stance detected** → **educational response** (analysis + next question).
  - If **stance detected** → **confirmation response** (educational-type): “Is [paraphrase] your current stance?”; do **not** run contrarian yet.
- When we return a **confirmation response**, client may show the same “I have a stance — challenge me” button; if the user then clicks it or replies “yes,” next request sends `explicitStanceAction: true` or a confirmed-stance payload so we run contrarian.

(Exact request fields—e.g. `explicitStanceAction` vs. a dedicated `action: 'state_stance'`—can be refined in implementation.)

---

## 5. Educational Path (No Stats)

- **Input:** topic, conversation history, mode = educational, user message (and optionally “last AI question” for context).
- **No stats or legislation sections** in the response. Gov data is optional (e.g. to enrich “common stances” in the analysis) and never shown as stats.
- **One LLM call:** analysis (common stances + origination + values challenged) + follow-up question (yes/no early, open-ended later by exchange count).
- **Output:** `type: 'educational'`, sections: analysis, followUpQuestion. Optionally a **confirmation variant**: same shape but content is “Is [paraphrase] your current stance?” and client can show the stance button again.
- **Success:** User can articulate a stance and then express it via the explicit action (button or “yes” to confirmation).

---

## 6. Contrarian Path (Stats Only When Direct Match)

- **Input:** topic, stated stance (from button click or confirmed paraphrase), conversation history, gov data (cached per topic).
- **Stats and legislation:** Include “Statistics Supporting / Challenging” and legislation **only** when the provided data contains a **direct, citable** match to the stance. Otherwise omit those sections; no filler (e.g. no “20 related bills”).
- **Stance expansion:** If the stated stance is short (e.g. “policy changes”), expand it in context using the last educational question so the model (and stats selection) sees a clear stance.
- **One or two LLM calls:** e.g. stance analysis + contrarian response, or single contrarian call with optional stats. Same “omit if no direct match” rule.
- **Output:** `type: 'challenge'`, sections: acknowledgment, optional keyStatisticsFor / keyStatisticsAgainst, optional legislation, deeperAnalysis, followUpQuestion. UI only shows stats/legislation when present.
- **Success:** User can strengthen understanding, change stance, learn about legislation, or become informed and take action. Product **explicitly** surfaces these (end-of-flow summary, CTAs for Learn legislation / Take action); architecture must expose data needed for summaries and CTAs.

---

## 7. Summary

| Concern | Approach |
|--------|----------|
| **Stance = explicit action** | Button “I have a stance — challenge me” or “yes” to “Is X your current stance?” Never treat unsolicited text as stance without confirmation. |
| **Typed stance without button** | Detect stance → ask “Is X your current stance?” → yes = explicit confirmation (contrarian); no = stay educational. |
| **Educational success** | User has a stance and can articulate it; they signal it via the explicit action. |
| **Contrarian success** | Strengthen understanding, change stance, learn legislation, take action; product explicitly surfaces (end-of-flow summary, CTAs for Learn legislation / Take action). |
| **Mode** | Client sends `mode` (from last response type); backend uses it plus `explicitStanceAction` to choose educational vs contrarian vs confirmation. |
| **Stats accuracy** | Include stats/legislation only when data has a direct match; otherwise omit sections. |

---

*No implementation in this doc; this is the target architecture for future implementation.*
