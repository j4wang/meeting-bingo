# SJ Sharks Bingo Category — Implementation Plan

## Review Summary

Reviewed: 2026-06-23 | Reviewers: VP Product, VP Engineering, VP Design

### Changes Applied

| # | Change |
|---|---|
| 1 | Steps 1+3 (CategoryId + SAMPLES) merged into one atomic step to prevent build breakage |
| 2 | Removed `'three goals'` alias — fires on common corporate speech ("three goals for this quarter") |
| 3 | Removed bare `'jumbo'` alias — matches "jumbo jet," "jumbo screen," etc. Kept `'jumbo joe'` only |
| 4 | Removed bare `'patty'` alias — matches "patty melt," "patty from accounting," etc. Kept `'patty marleau'` only |
| 5 | Removed misleading Will Smith alias comment; documented honestly that primary key fires on actor too; recommend manual fill |
| 6 | Added `'goal horn'` to word list |
| 7 | Added 10 hockey action buzzwords to reduce proper-noun density (was 24/49 = 49%; now 24/60 = 40%) |
| 8 | Added roster snapshot date (2024-25) and annual review note |
| 9 | Added mobile name-length note: names >14 chars must be verified for wrap in BingoSquare |
| 10 | Grid update `md:grid-cols-2 lg:grid-cols-4` is now required (not optional) — 3+1 layout is broken |
| 11 | Changed primary key `'five-hole'` → `'five hole'` (speech APIs never produce the hyphen) |
| 12 | Fixed inaccurate grid reflow description in Out of Scope section |
| 13 | Removed `'pk'` alias for penalty kill — too many false positives (player initials, "PK Subban") |
| 14 | Mobile grid layout promoted from optional to required per watch-party use case |
| 15 | Added pronunciation aliases for Slavic/Scandinavian names (Askarov, Zetterlund, Granlund) |
| 16 | Added note: TV audio bleed means manual tap is the primary UX; silence detection behaviour documented |
| 17/19 | Added CategorySelect framing copy update to `description` field to accommodate sports context |
| 18 | Changed sample chip to `'Celebrini'` (short) instead of `'Macklin Celebrini'` |
| 20 | Added explicit note to verify 44px touch targets with wrapped long names during dev verification |
| 21 | Added note: generateCard() has no guard for <24 words — file a follow-up to add a runtime check |
| 22 | Schema no-bump reasoning is sound — add explanation to commit message |
| 23 | Removed `'blackwood'` bare alias (surname ambiguity); kept `'nabby'` and `'askarov'` as low-risk |
| 24 | Reordered description copy to lead with current players |
| 25 | Added note to confirm 🦈 icon is aria-hidden="true" per existing CategorySelect pattern |
| 26 | Noted 'Shark Tank' TV show ambiguity — accepted low risk |
| 27 | Noted shot-type buzzword clustering (wrist shot, slap shot, one-timer) — acceptable for watch-party fun |

---

## Goal

Add a `'sharks'` bingo category to meeting-bingo featuring San Jose Sharks legends, current players, and game-day buzzwords. The card is meant to be played during Sharks broadcasts or watch parties — **manual tap is the primary fill UX** (TV audio bleed keeps the mic noisy) and speech detection is a secondary bonus.

> **Roster snapshot**: 2024-25 season. Review player list each off-season for trades and signings.

---

## Scope of Changes

### Step 1 (atomic): `src/types/index.ts` + `src/components/CategorySelect.tsx`

These two changes **must land together** — `SAMPLES` is typed as `Record<CategoryId, string[]>`, so extending the union without adding the key breaks the build.

**`src/types/index.ts`**:
```ts
// Before
export type CategoryId = 'agile' | 'corporate' | 'tech'

// After
export type CategoryId = 'agile' | 'corporate' | 'tech' | 'sharks'
```

**`src/components/CategorySelect.tsx`** — add `sharks` key to `SAMPLES` in the same commit:
```ts
const SAMPLES: Record<CategoryId, string[]> = {
  agile: ['sprint', 'backlog', 'story points', 'retrospective'],
  corporate: ['synergy', 'circle back', 'ROI', 'low-hanging fruit'],
  tech: ['kubernetes', 'CI/CD', 'microservices', 'observability'],
  sharks: ['Celebrini', 'Patrick Marleau', 'hat trick', 'Shark Tank'],
}
```

Note: sample uses `'Celebrini'` (short form) — full name is too wide for the preview chip.

Also update the grid class in `CategorySelect.tsx`:
```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// After — required, not optional (4th card orphans on 3-col grid at md breakpoint)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

Also add a description subtitle to the page or a framing note on the Sharks card to acknowledge it's a sports/watch-party category alongside the workplace categories:
```tsx
// In the Sharks category object description field:
description: 'Current players, legends, and game-day buzzwords',
```

No schema version bump needed — adding a new category ID is additive and does not break existing saved `GameState` objects. Document this in the commit message.

---

### Step 2: `src/data/categories.ts` — Add Sharks category entry

Append a new object to the `CATEGORIES` array. Word pool: 24 proper nouns + 36 hockey buzzwords = 60 total (40% proper nouns, down from 49%).

```ts
{
  id: 'sharks',
  name: 'SJ Sharks',
  description: 'Current players, legends, and game-day buzzwords',
  icon: '🦈',
  words: [
    // --- Legends (12) ---
    'Patrick Marleau',
    'Joe Thornton',
    'Joe Pavelski',
    'Evgeni Nabokov',
    'Dan Boyle',
    'Owen Nolan',
    'Vincent Damphousse',
    'Mike Vernon',
    'Jeremy Roenick',
    'Dany Heatley',
    'Marco Sturm',
    'Ryane Clowe',

    // --- Current players, 2025-26 (12) ---
    'Macklin Celebrini',
    'Will Smith',
    'Collin Graf',
    'Michael Misa',
    'Alexander Wennberg',
    'Tyler Toffoli',
    'Mario Ferraro',
    'Dmitry Orlov',
    'Sam Dickinson',
    'Alex Nedeljkovic',
    'Yaroslav Askarov',
    'Kiefer Sherwood'

    // --- Hockey buzzwords (36) ---
    'power play',
    'penalty kill',
    'hat trick',
    'five hole',
    'wrist shot',
    'slap shot',
    'breakaway',
    'icing',
    'face-off',
    'plus-minus',
    'Shark Tank',
    'teal',
    'goal horn',
    'shutout',
    'overtime',
    'shootout',
    'bar down',
    'one-timer',
    'odd-man rush',
    'empty net',
    'delayed penalty',
    'forecheck',
    'neutral zone',
    'blue line',
    'crease',
    'snipe',
    'saucer pass',
    'tip in',
    'wraparound',
    'dump and chase',
    'breakout',
    'cross-check',
    'high-sticking',
    'game-winner',
    'two-line pass',
    'screen shot',
  ],
}
```

> **Word count**: 60 words → random 5×5 cards draw 24 of these, producing good variety.
>
> **Long names**: 'Vincent Damphousse' (18 chars) and 'Mackenzie Blackwood' (19 chars) are the longest entries. Verify text wraps cleanly inside BingoSquare (min-h-[44px] min-w-[44px]) during dev verification step.
>
> **'Shark Tank' note**: Also an ABC TV show — arena usage ("The Tank") is primary in Sharks broadcasts. Accepted low risk.
>
> **Shot clustering**: 'wrist shot', 'slap shot', 'one-timer' may all fire in one broadcast sequence. Acceptable for watch-party fun.

---

### Step 3: `src/lib/wordDetector.ts` — Add Sharks word aliases

Add entries to `WORD_ALIASES`. Removed aliases that caused too many false positives:
- ❌ `'three goals'` (fires on "we have three goals for Q3")
- ❌ bare `'jumbo'` (fires on "jumbo screen," "jumbo jet")
- ❌ bare `'patty'` (fires on "patty from accounting")
- ❌ `'pk'` (fires on player initials, "PK Subban")
- ❌ `'blackwood'` (common English surname)

```ts
// Sharks player aliases
'joe thornton': ['jumbo joe'],
'patrick marleau': ['patty marleau'],
'macklin celebrini': ['celebrini', 'mack celebrini'],
'william eklund': ['eklund'],
'evgeni nabokov': ['nabokov', 'nabby'],
'yaroslav askarov': ['askarov', 'yaroslav'],
'fabian zetterlund': ['zetterlund'],
'mikael granlund': ['granlund'],

// Hockey term aliases
'power play': ['on the power play', 'man advantage', 'pp goal'],
'penalty kill': ['on the penalty kill', 'shorthanded'],
'five hole': ['through the five hole', 'five-hole'],
'plus-minus': ['plus minus'],
'odd-man rush': ['odd man rush', 'two on one', 'three on two'],
'hat trick': ['hat-trick'],
```

> **Will Smith**: The primary key `'will smith'` (multi-word, uses `includes()`) will fire on any mention — including the actor. No alias suppresses this. Manual fill is recommended for this square; no alias added.

---

## Files Changed

| File | Change |
|---|---|
| `src/types/index.ts` | Add `'sharks'` to `CategoryId` union **(atomic with CategorySelect)** |
| `src/components/CategorySelect.tsx` | Add `sharks` to `SAMPLES`; fix grid to `md:grid-cols-2 lg:grid-cols-4` |
| `src/data/categories.ts` | Append Sharks category object (60 words) |
| `src/lib/wordDetector.ts` | Add Sharks player/hockey aliases to `WORD_ALIASES` |

No new files. No schema version bump. No routing changes.

---

## Known Gaps (follow-up tickets)

- **generateCard() has no guard** for a word pool < 24 entries. Currently not a problem (60 words) but a future editor could accidentally break card generation silently. File a follow-up to add a runtime assertion.
- **Will Smith false positive**: No alias-based fix exists. Consider replacing with a different current player to avoid the ambiguity, or accept manual fill.
- **Roster staleness**: Review player list at season start each year. Consider adding a `// Last reviewed: 2024-25` comment in categories.ts.

---

## Implementation Order

1. **(Atomic)** `src/types/index.ts` + `src/components/CategorySelect.tsx` — extend `CategoryId`, add `SAMPLES.sharks`, fix grid class. Single commit prevents build breakage between steps.
2. `src/data/categories.ts` — add category data (60 words)
3. `src/lib/wordDetector.ts` — add aliases
4. `npm run typecheck && npm run lint` — confirm no regressions
5. `npm run dev` — verify:
   - Sharks card appears in 2×2 grid at md, 4-in-a-row at lg
   - Card generates with 24 words + FREE center
   - Long names ('Vincent Damphousse', 'Mackenzie Blackwood') wrap cleanly in squares
   - 44px touch targets maintained with wrapped text
   - 🦈 icon is `aria-hidden="true"` on the category card (per existing pattern)
   - Existing categories (agile, corporate, tech) unaffected
