# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Type-check + Vite production build
npm run preview      # Preview the production build locally
npm run lint         # Run oxlint on src/
npm run typecheck    # Run tsc -b --noEmit (type-check all projects without building)
```

Project setup (first time only):
```bash
npm create vite@latest . -- --template react-ts
npm install canvas-confetti
npm install -D tailwindcss postcss autoprefixer @types/canvas-confetti
npx tailwindcss init -p
```

## Hard Constraints

- **No audio output at any point.** No `Audio()`, `SpeechSynthesis`, browser beeps, or notification sounds. The user is in a live meeting and any accidental sound will expose them. Win celebration is confetti-only.
- **Audio never leaves the device.** Do not add server-side transcription, audio upload, or any external speech API. Speech pipeline is 100% client-side via the browser's native Web Speech API.

## Architecture

**Stack**: React 19 + TypeScript, Vite, Tailwind CSS, Web Speech API (browser-native, no API keys), canvas-confetti, localStorage. No backend, no routing library, zero cost to run.

### Screen-based navigation

`App.tsx` manages a `Screen` type (`'landing' | 'category' | 'game' | 'win'`) and conditionally renders top-level components. There is no URL router — all navigation is state transitions in `App`. The `WinScreen` renders as an **overlay on top of `GameBoard`**, not a replacement — the user keeps the card visible and can choose "Keep Playing" without losing game context.

### Module layout

```
src/
  types/index.ts          # All shared TypeScript interfaces (BingoSquare, BingoCard, GameState, etc.)
  data/categories.ts      # Buzzword arrays for 3 categories: 'agile' | 'corporate' | 'tech'
  lib/
    cardGenerator.ts      # Fisher-Yates shuffle → 5×5 grid; center [2][2] is always FREE
    bingoChecker.ts       # Checks all 12 win lines (5 rows + 5 cols + 2 diagonals)
    wordDetector.ts       # Regex word-boundary for single words; substring for multi-word phrases
    shareUtils.ts         # Clipboard/Web Share API for result sharing
  hooks/
    useSpeechRecognition.ts  # Web Speech API wrapper; see Speech Recognition section below
    useGame.ts               # Game state mutations (fill square, detect bingo)
    useBingoDetection.ts     # Win condition hook
    useLocalStorage.ts       # Typed localStorage persistence
  components/
    LandingPage.tsx
    CategorySelect.tsx
    GameBoard.tsx            # Main container during play
    BingoCard.tsx            # 5×5 grid; role="grid"
    BingoSquare.tsx          # Single square; isFilled/isAutoFilled/isFreeSpace/isWinningSquare states
    TranscriptPanel.tsx      # Live transcript + detected words; collapses on mobile
    WinScreen.tsx            # Overlay (not full-screen replacement)
    GameControls.tsx
    ui/Button.tsx, Card.tsx, Toast.tsx
  context/GameContext.tsx    # Global game state (React Context)
```

### Key data model

`BingoSquare` has `isAutoFilled: boolean` to distinguish speech-detected fills from manual taps. The free space at `[2][2]` starts with `isFilled: true`. `BingoCard.words` is a flat string array kept alongside the 5×5 grid for efficient word detection. `GameState` includes `schemaVersion: number` for localStorage compatibility — on version mismatch, discard stale state and start fresh.

### Speech recognition

`useSpeechRecognition` wraps `window.SpeechRecognition || window.webkitSpeechRecognition`. Critical implementation requirements:

- **Instance in `useRef`**: create the `SpeechRecognition` instance once in `useRef`, initialize in `useEffect(() => {...}, [])`, call `recognition.abort()` in the cleanup. React Strict Mode double-invocation otherwise creates two live instances with duplicate detections.
- **Restart guard**: `onend` uses an `isRestarting` ref (set before `recognition.start()`, cleared in `onstart`) to prevent overlapping calls. Wrap `recognition.start()` in try/catch to swallow `InvalidStateError` (Chrome bug when `onend` fires during an in-flight `start()`).
- **Word detection on `isFinal` only**: `detectWordsWithAliases()` must never be called on interim results — only on `isFinal` transcript chunks.
- **Silence detection**: if no `onresult` fires within 10 seconds while `isListening` is true, set `isSilent` and stop the restart loop; show "No audio detected — is your mic muted?".

`wordDetector.ts` uses regex `\bword\b` for single-word terms and `includes()` for multi-word phrases. `WORD_ALIASES` handles spoken variants (`"CI CD"` → `"CI/CD"`). Hardcoded for `en-US` — document this limitation at the top of the file.

### Browser compatibility

| Browser | Speech | Notes |
|---|---|---|
| Chrome / Edge | ✅ Full | Primary target |
| Safari (macOS) | ✅ webkit prefix | `webkitSpeechRecognition` |
| iOS Safari | ❌ Manual only | `onend` auto-restart is unreliable; treat as `isSupported: false` at runtime via `/(iPad|iPhone|iPod)/i.test(navigator.userAgent)` |
| Firefox | ❌ Manual only | API absent; feature-detect `!!window.SpeechRecognition || !!window.webkitSpeechRecognition` |

All unsupported browsers fall back to manual tap-to-fill mode. Show a persistent banner; skip mic permission prompt entirely.

### BingoSquare visual states

States must use **icons alongside color** so color-blind users can distinguish them:

| State | Color | Icon | Notes |
|---|---|---|---|
| Default | white / gray border | — | hover: blue border |
| Filled | blue | ✓ checkmark | manual or auto-filled |
| Free space | amber | ★ star | non-clickable |
| Winning | green + ring | 🏆 trophy | applied via `isWinningSquare` prop |

`isAutoFilled` triggers a one-shot `fillPop` keyframe animation (scale 0.9 → 1.05 → 1.0, ~200ms). **Do not use `animate-pulse`** — it loops indefinitely and draws colleague attention in meetings. Minimum touch target: `min-h-[44px] min-w-[44px]` (WCAG 2.5.5).

### Win state guard

At the top of the `onresult` handler and inside `useGame`'s fill mutation, always check `if (gameState.status === 'won') return;`. Two words detected in one `isFinal` event can both complete a line simultaneously, causing `onWin()` to fire twice and corrupt `completedAt`.

### Toast behavior

- Standard toasts auto-dismiss after 3 seconds.
- "One away!" toast is **persistent** — no auto-dismiss. It stays until bingo occurs or the user explicitly closes it. A 3-second dismiss loses the signal if the user is looking away.

### ARIA requirements

| Element | Requirement |
|---|---|
| `BingoCard` container | `role="grid"` |
| Row wrapper | `role="row"` |
| `BingoSquare` button | `role="gridcell"` + `aria-pressed={isFilled}` + `aria-label="{word} — filled/not filled"` |
| Mic status dot | `aria-label="Microphone active/inactive"`; respect `prefers-reduced-motion` (border change only, no pulse) |
| Start/Stop button | `aria-label="Start listening"` / `"Stop listening"` |
| `TranscriptPanel` | `aria-live="polite"` |
| `WinScreen` overlay | `role="dialog"` + `aria-modal="true"` |

### localStorage

Always write `schemaVersion: 1` into the persisted `GameState`. On restore: if version mismatches, discard and start fresh. On valid restore: show a "Resume your game?" prompt — never silently restore a stale card.
