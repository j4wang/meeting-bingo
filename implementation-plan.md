# Meeting Bingo — Implementation Plan

**Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Web Speech API, canvas-confetti, localStorage  
**Target**: Fully functional single-player MVP deployable to Vercel at zero cost

---

## Review Summary

Reviewed: 2026-06-23 | Reviewers: VP Product, VP Engineering, VP Design

### Changes Applied

| # | Change |
|---|--------|
| 1 | Added terminal win-state guard (`if (status === 'won') return`) to prevent double-fire on simultaneous word detections |
| 2 | Added `isRestarting` ref + try/catch to `useSpeechRecognition` to fix Chrome `InvalidStateError` race condition on `onend` restart |
| 3 | Specified `SpeechRecognition` instance must live in `useRef`, initialized in `useEffect`, aborted in cleanup — prevents React Strict Mode duplicate instances |
| 4 | Added iOS Safari detection with explicit fallback to manual-only mode (same path as Firefox) |
| 5 | Replaced `animate-pulse` (infinite loop) with one-shot `transition-transform duration-200` on auto-filled squares |
| 6 | Added hard constraint: no audio output at any point; win celebration is purely visual (confetti only) |
| 7 | Added "Keep playing" option to WinScreen — overlay on card rather than replacing GameBoard entirely |
| 8 | Added muted-mic / prolonged-silence handling: timeout after 10s of no `onresult` events, show status indicator, stop restart loop |
| 9 | Added `localStorage` schema version field; on mismatch, discard stale state and start fresh |
| 10 | Added buzzword curation step: cross-category duplicate check and removal before finalizing word lists |
| 11 | Added non-color indicators to `BingoSquare` states: icons + patterns alongside color for color-blind accessibility |
| 12 | Added 44×44px minimum touch target enforcement on `BingoSquare` for WCAG compliance |
| 13 | Added `navigator.permissions.query` pre-check on mount to avoid mid-meeting permission flicker |
| 14 | Documented that `detectWords` must only be called on `isFinal` results; added lint comment guard |
| 15 | Added ARIA roles: `role="grid"` on `BingoCard`, `aria-pressed` on squares, `aria-label` on mic toggle, `aria-live="polite"` on `TranscriptPanel` |
| 16 | Added locale note: `WORD_ALIASES` and `lang` to be configurable; document `en-US` limitation for non-US English speakers |
| 17 | Changed "One away!" Toast to persist until dismissed or a bingo occurs (not auto-dismiss) |
| 18 | `TranscriptPanel` collapses on mobile by default; tap-to-expand toggle |
| 19 | Added `aria-label` and `prefers-reduced-motion` support to mic status dot |
| 20 | Defined share payload format: plain-text result with category, time, filled count, and bingo line |
| 21 | Added "Resume game?" prompt on `localStorage` restore — user explicitly opts in before stale card appears |
| 22 | Added general ARIA requirements section covering all interactive elements |
| 23 | Corrected `canvas-confetti` bundle size note: ~10 KB gzipped; justified as acceptable |
| 24 | Added visible fallback message if both Web Share and clipboard APIs fail on WinScreen |

---

## Hard Constraints

- **No audio output at any point.** No `Audio()`, `SpeechSynthesis`, browser beeps, or notification sounds. The win celebration is purely visual (confetti only). The user is in a meeting.
- **Audio never leaves the device.** Do not add server-side transcription, audio upload, or external speech API. Speech pipeline is 100% client-side via the browser's native Web Speech API.

---

## Phase 1 — Project Setup (15 min)

Initialize the project in `/workspaces/meeting-bingo/`:

```bash
npm create vite@latest . -- --template react-ts
npm install canvas-confetti
npm install -D tailwindcss postcss autoprefixer @types/canvas-confetti
npx tailwindcss init -p
```

**Tasks**:
1. Configure `tailwind.config.js` — add `content` glob for `src/**/*.{ts,tsx}` and a one-shot `fillPop` keyframe animation (scale 0.9 → 1.05 → 1.0, 200ms total — replaces the originally planned looping `bounceIn`)
2. Wire Tailwind into `src/index.css` with `@tailwind base/components/utilities`
3. Set `server.port = 3000` in `vite.config.ts`

**Exit criteria**: `npm run dev` serves a blank page with Tailwind working

---

## Phase 2 — Types & Data (10 min)

**Tasks**:
1. Create `src/types/index.ts` — all shared interfaces:
   - `BingoSquare` — `id`, `word`, `isFilled`, `isAutoFilled`, `isFreeSpace`, `filledAt`, `row`, `col`
   - `BingoCard` — `squares: BingoSquare[][]` (5×5), `words: string[]` (flat, for detection)
   - `CategoryId` — `'agile' | 'corporate' | 'tech'`
   - `GameState` — `status`, `category`, `card`, `isListening`, `startedAt`, `completedAt`, `winningLine`, `winningWord`, `filledCount`, **`schemaVersion: number`** (for localStorage compatibility)
   - `WinningLine` — `type`, `index`, `squares: string[]`
   - `SpeechRecognitionState`, `Toast`
2. Create `src/data/categories.ts` — three buzzword arrays (40+ words each) for `agile`, `corporate`, and `tech` categories
   - **Curation step required**: run a cross-category duplicate check before finalizing lists; remove any word appearing in more than one category to keep each list distinct

**Exit criteria**: `npm run typecheck` passes with no errors

---

## Phase 3 — Core Game Logic (20 min)

Pure functions with no React dependencies — unit-testable in isolation.

**Tasks**:
1. `src/lib/cardGenerator.ts`
   - Fisher-Yates shuffle
   - `generateCard(categoryId)` — builds 5×5 grid; center `[2][2]` is always the FREE space (pre-filled)
   - `getCardWords(card)` — returns the flat word list for detection

2. `src/lib/bingoChecker.ts`
   - `checkForBingo(card)` — checks all 12 win lines (5 rows, 5 columns, 2 diagonals); returns first `WinningLine` found or `null`
   - `countFilled(card)` — count for the progress display
   - `getClosestToWin(card)` — returns `{ needed, line }` for the near-bingo hint UI

3. `src/lib/wordDetector.ts`
   - `detectWords(transcript, cardWords, alreadyFilled)` — regex `\bword\b` for single-word terms; `includes()` for multi-word phrases (e.g. "story points")
   - **Only ever called on `isFinal` results** — never on interim results; add a JSDoc note on the function signature to enforce this
   - `WORD_ALIASES` map — handles spoken variants (`'ci/cd' → ['ci cd', 'cicd']`, `'roi' → ['return on investment']`, etc.)
   - `detectWordsWithAliases()` — runs base detection then alias expansion
   - **Locale limitation**: `WORD_ALIASES` and `lang = 'en-US'` are hardcoded for US English. Document this at the top of the file. Non-US English speakers may experience lower detection accuracy.

4. `src/lib/shareUtils.ts`
   - `shareResult(game)` — builds text summary, tries `navigator.share()` first (mobile), falls back to `navigator.clipboard.writeText()`
   - **Share payload format** (plain text):
     ```
     Meeting Bingo — [Category] 🎯
     BINGO in [MM:SS] • [N]/24 squares filled
     Winning line: [row/col/diagonal description]
     (played with Meeting Bingo — audio never recorded)
     ```
   - If both `navigator.share()` and `navigator.clipboard` fail, return an error string so the caller can surface a visible "Share failed — copy manually:" message with the text inline

---

## Phase 4 — UI Components (30 min)

Build bottom-up: shared primitives first, then screens.

**Tasks**:
1. **Shared UI**
   - `src/components/ui/Button.tsx` — variant props (`primary`, `secondary`, `ghost`)
   - `src/components/ui/Card.tsx` — container with shadow and padding
   - `src/components/ui/Toast.tsx` — default auto-dismisses after 3 seconds; "One away!" variant is **persistent** (no auto-dismiss) until dismissed by user or superseded by a win

2. **LandingPage** (`src/components/LandingPage.tsx`)
   - Hero: "🎯 MEETING BINGO" headline + tagline
   - Prominent "New Game" CTA button
   - "How It Works" 4-step list
   - Privacy badge: "🔒 Audio processed locally. Never recorded."

3. **CategorySelect** (`src/components/CategorySelect.tsx`)
   - Three category cards with icon, name, description, and sample word preview
   - Back button returning to landing

4. **BingoSquare** (`src/components/BingoSquare.tsx`)
   - Four visual states via Tailwind class composition:
     - Default: white background, gray border
     - Filled: blue background, white text, **checkmark icon (✓)**
     - Free space: amber background, **star icon (★)**, non-clickable
     - Winning: green background, ring highlight, **trophy icon (🏆)**
   - Color is supplemented by icons so color-blind users can distinguish all states
   - `isAutoFilled` triggers the one-shot `fillPop` animation (scale pop, 200ms) — **not** `animate-pulse` (which loops indefinitely and draws attention in meetings)
   - Minimum size: **44×44px touch target** at all viewports (WCAG 2.5.5); enforce via `min-h-[44px] min-w-[44px]`
   - `aria-pressed={isFilled}` on the button element; `aria-label="{word} — {filled/not filled}"`

5. **BingoCard** (`src/components/BingoCard.tsx`)
   - 5×5 CSS grid using `grid-cols-5`
   - `role="grid"` on the container; each row `role="row"`; each square `role="gridcell"`
   - Passes `isWinningSquare` boolean to each square based on `winningLine.squares`

6. **GameHeader** (`src/components/GameBoard.tsx` region)
   - Logo, mic status indicator, `X/24 squares filled` counter
   - Mic status: pulsing red dot when active, grey when inactive
     - Respects `prefers-reduced-motion`: no pulse animation when reduced motion is preferred; use border change only
     - `aria-label="Microphone active"` / `aria-label="Microphone inactive"` on the indicator element

7. **TranscriptPanel** (`src/components/TranscriptPanel.tsx`)
   - Last 100 characters of final transcript in dark text
   - Interim transcript in grey italic
   - Detected word badges with ✨ prefix (last 5)
   - `aria-live="polite"` on the panel so screen readers announce new detections
   - **Mobile**: collapsed by default; show a single-line "🎤 Listening…" summary with a tap-to-expand chevron; expands to full panel

8. **GameControls** (`src/components/GameControls.tsx`)
   - "New Card" button (regenerates card, resets state)
   - "Start/Stop Listening" toggle — `aria-label="Start listening"` / `aria-label="Stop listening"`

9. **GameBoard** (`src/components/GameBoard.tsx`)
   - Composes GameHeader + BingoCard + TranscriptPanel + GameControls

10. **WinScreen** (`src/components/WinScreen.tsx`)
    - Rendered as an **overlay on top of GameBoard**, not a full screen replacement — preserves the card and transcript in context
    - "🎉 BINGO!" heading
    - Final card with winning line highlighted (visible beneath the overlay)
    - Stats: time elapsed, winning word, squares filled, category played
    - "Share Result" button — on failure (both Web Share and clipboard), show inline "Share failed — copy manually:" with the text
    - "Keep Playing" button — dismisses overlay, returns to active GameBoard (game remains in `'won'` status but user can still interact)
    - "Play Again" button — resets state, returns to CategorySelect

---

## Phase 5 — Speech Integration (20 min)

**Tasks**:
1. `src/hooks/useSpeechRecognition.ts`
   - **Instance management**: create `SpeechRecognition` instance once in `useRef`; initialize in `useEffect(() => {...}, [])`; call `recognition.abort()` in the cleanup function. This prevents React Strict Mode double-invocation and HMR from creating duplicate live instances.
   - Sets `continuous = true`, `interimResults = true`, `lang = 'en-US'`
   - **Restart guard**: `onend` handler uses an `isRestarting` ref (set to `true` before calling `recognition.start()`, cleared in `onstart`) to prevent overlapping start calls. Wrap `recognition.start()` in try/catch; swallow `InvalidStateError` silently.
   - **Silence/muted-mic detection**: if no `onresult` event fires within 10 seconds while `isListening` is true, set a `isSilent` state flag and stop the restart loop. Show a status indicator ("No audio detected — is your mic muted?"). Reset on next successful `onresult`.
   - **iOS detection**: `/(iPad|iPhone|iPod)/i.test(navigator.userAgent)`. If iOS is detected at init, set `isSupported: false` immediately (same path as Firefox). The `onend` auto-restart pattern is unreliable on iOS Safari.
   - Feature-detects `window.SpeechRecognition || window.webkitSpeechRecognition`; sets `isSupported: false` for Firefox and iOS
   - Exposes `startListening(onResult?)`, `stopListening()`, `resetTranscript()`, **`isSilent`**

2. `src/hooks/useLocalStorage.ts` — generic typed hook: `useLocalStorage<T>(key, defaultValue)`

3. Wire speech into `GameBoard`:
   - **Terminal state guard**: at the top of the `onresult` handler (and inside `useGame`'s fill mutation), `if (gameState.status === 'won') return;` — prevents double-fire when two words complete a line in a single `isFinal` event
   - Call `detectWordsWithAliases()` only on `isFinal` results — never on interim results
   - Fill matching squares in game state, update `filledCount`
   - Run `checkForBingo()` after each fill; if win, call `onWin(winningLine, winningWord)`

4. Microphone permission flow:
   - **Pre-check on mount**: call `navigator.permissions.query({ name: 'microphone' })` before attempting `recognition.start()`. If already `'denied'`, go straight to manual-only mode without triggering the browser prompt.
   - Show inline explainer before `recognition.start()` explaining local processing
   - Handle `error: 'not-allowed'` by setting a `manualOnly` flag and showing a persistent banner
   - If `isSupported` is false (Firefox, iOS), skip mic prompt entirely and show a "Manual mode" notice

---

## Phase 6 — Win Celebration & Persistence (10 min)

**Tasks**:
1. Fire `canvas-confetti` on win — burst from center, no sound (user is still in a meeting). Bundle cost: ~10 KB gzipped; acceptable for the use case.
2. Highlight winning line squares using the `isWinningSquare` green ring state in `BingoSquare`
3. Persist `GameState` to localStorage via `useLocalStorage`:
   - Always write `schemaVersion: 1` (current version) into the persisted object
   - On restore: if `schemaVersion` is missing or does not match the current version, discard the stale state and start fresh (no silent corruption)
   - On restore with a valid version: **prompt the user** — show a "Resume your game?" modal before restoring the stale card. User can dismiss to start fresh.
4. Share button:
   - Call `shareUtils.shareResult()` and show a "Copied!" Toast on success
   - On failure (both Web Share and clipboard APIs unavailable), show the share text inline with a "Copy manually" instruction — never silently fail

---

## Phase 7 — Polish & Deploy (15 min)

**Tasks**:
1. **Responsive layout** — test at 375px (iPhone SE) and 1280px
   - Squares: minimum `44×44px` touch target (WCAG 2.5.5); `text-xs sm:text-sm` for label text
   - 5×5 grid with `aspect-square` on each cell; grid width constrained so cells never go below 44px at 375px
2. **Near-bingo hint** — when `getClosestToWin().needed === 1`, add a pulsing border to the incomplete line and show a **persistent** "One away!" Toast (no auto-dismiss; dismissed when a bingo occurs or user closes it)
3. **Same-word guard** — confirmed by `alreadyFilled: Set<string>` in the detector; a word spoken multiple times only fills once
4. **Firefox / iOS fallback banner** — "Speech recognition not supported — tap squares manually" notice; shown for both Firefox (API absent) and iOS Safari (API unreliable)
5. **TranscriptPanel mobile collapse** — verify the collapsed/expanded toggle is functional at 375px; collapsed by default on viewport width < 640px
6. **`prefers-reduced-motion`** — verify mic status dot and `fillPop` animation respect the media query; disable animations when set
7. **Deploy**: connect repo to Vercel for automatic deploys on push to `main`

---

## Screen Flow

```
Landing → CategorySelect → GameBoard ←─────────────┐
                               │                    │
                               ↓             "Keep Playing"
                           WinScreen (overlay)       │
                               │                    │
                               └─── "Play Again" ───┘
                                    (→ CategorySelect)
```

Navigation is managed as `Screen` state in `App.tsx` (`'landing' | 'category' | 'game' | 'win'`) — no URL router needed for a 4-screen app. The `WinScreen` renders as an overlay over `GameBoard` rather than replacing it.

---

## Key Architectural Decisions

| Decision | Reason |
|---|---|
| Screen-state navigation, no React Router | Simpler for a 4-screen app; no URL or routing complexity |
| `BingoCard.words` flat array alongside the 5×5 grid | Avoids re-flattening the grid on every speech event |
| `isAutoFilled` flag on each square | Powers the fill animation and enables future auto-vs-manual stats |
| `SpeechRecognition` instance in `useRef`, initialized in `useEffect` | Prevents React Strict Mode / HMR from creating duplicate live instances |
| `isRestarting` ref guard + try/catch on `recognition.start()` | Fixes Chrome `InvalidStateError` race condition when `onend` fires during an in-flight `start()` call |
| iOS Safari treated as `isSupported: false` | `onend` auto-restart is unreliable on iOS; manual-only is the honest fallback |
| Terminal `if (status === 'won') return` guard in fill handler | Prevents double-fire when two words simultaneously complete a winning line in one `isFinal` event |
| `alreadyFilled` Set passed into detector | Prevents duplicate fills when the same buzzword is repeated |
| One-shot `fillPop` animation instead of `animate-pulse` | Looping pulse draws colleague attention during meetings; one-shot settles immediately |
| `canvas-confetti` over CSS-only animation | Deterministic bundle size (~10 KB gzipped); no runtime jank risk during the win moment |
| `localStorage` `schemaVersion` field | Guards against silent state corruption when data model changes between deploys |
| WinScreen as overlay, not full replacement | User keeps the card and transcript in context; "Keep Playing" is a valid meeting strategy |
| Persistent "One away!" Toast | 3s auto-dismiss loses the signal if the user is looking away; persistent until bingo or dismissed |

---

## ARIA Requirements

All interactive and dynamic elements must meet WCAG 2.1 AA:

| Element | Requirement |
|---|---|
| `BingoCard` container | `role="grid"` |
| Row wrapper | `role="row"` |
| `BingoSquare` | `role="gridcell"` + `aria-pressed={isFilled}` + `aria-label="{word} — {filled/not filled}"` |
| Mic status indicator | `aria-label="Microphone active"` or `"Microphone inactive"` |
| Start/Stop Listening button | `aria-label="Start listening"` / `"Stop listening"` |
| `TranscriptPanel` | `aria-live="polite"` |
| Win overlay | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to "BINGO!" heading |

---

## Out of Scope (MVP)

- User accounts / authentication
- Multiplayer real-time sync
- Custom buzzword creation
- Sound effects (hard constraint: no audio output)
- Game history beyond current session
- Dark mode
- Multi-language / non-English `WORD_ALIASES` support
