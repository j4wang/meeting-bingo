# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Type-check + Vite production build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint on all .ts/.tsx files
npm run typecheck    # Run tsc --noEmit (type-check without building)
```

Project setup (first time only):
```bash
npm create vite@latest . -- --template react-ts
npm install canvas-confetti
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Architecture

**Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Web Speech API (browser-native, no API keys), canvas-confetti, localStorage. No backend, no routing library, zero cost to run.

### Screen-based navigation

`App.tsx` manages a `Screen` type (`'landing' | 'category' | 'game' | 'win'`) and conditionally renders top-level components. There is no URL router — all navigation is state transitions in `App`.

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
    useSpeechRecognition.ts  # Web Speech API wrapper; auto-restarts on onend to stay continuous
    useGame.ts               # Game state mutations (fill square, detect bingo)
    useBingoDetection.ts     # Win condition hook
    useLocalStorage.ts       # Typed localStorage persistence
  components/
    LandingPage.tsx
    CategorySelect.tsx
    GameBoard.tsx            # Main container during play
    BingoCard.tsx            # 5×5 grid
    BingoSquare.tsx          # Single square; isFilled/isAutoFilled/isFreeSpace/isWinningSquare states
    TranscriptPanel.tsx      # Live transcript + detected words display
    WinScreen.tsx
    GameControls.tsx
    ui/Button.tsx, Card.tsx, Toast.tsx
  context/GameContext.tsx    # Global game state (React Context)
```

### Key data model

`BingoSquare` has `isAutoFilled: boolean` to distinguish speech-detected fills from manual taps. The free space at `[2][2]` starts with `isFilled: true`. `BingoCard.words` is a flat string array kept alongside the 5×5 grid for efficient word detection.

### Speech recognition

`useSpeechRecognition` wraps `window.SpeechRecognition || window.webkitSpeechRecognition`. It sets `continuous = true`, `interimResults = true`. The `onend` handler restarts recognition automatically if `isListening` is still true — this is what keeps it alive across silence. Word detection happens only on `isFinal` results.

`wordDetector.ts` uses regex `\bword\b` for single-word terms and plain `includes()` for multi-word phrases (e.g. "story points"). `WORD_ALIASES` handles spoken variants like "CI CD" → "CI/CD".

### Browser compatibility

Web Speech API works in Chrome, Edge, and Safari (webkit prefix). Firefox support is behind a flag — the app should detect `!!window.SpeechRecognition || !!window.webkitSpeechRecognition` and degrade gracefully to manual-only mode.

## Privacy constraint

Audio never leaves the device. Do not add any server-side transcription, audio upload, or external speech API. The entire speech pipeline must remain client-side via the browser's native Web Speech API.
