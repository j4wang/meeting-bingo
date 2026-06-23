// Locale: hardcoded for en-US. WORD_ALIASES covers common spoken variants for
// US English. Non-US English speakers may experience lower detection accuracy.
// lang is set to 'en-US' in useSpeechRecognition.ts.

const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration continuous delivery'],
  'roi': ['return on investment'],
  'api': ['a p i'],
  'sla': ['s l a', 'service level agreement'],
  'mvp': ['minimum viable product'],
  'wip limit': ['work in progress limit'],
  'devops': ['dev ops'],
  'kanban': ['kan ban'],

  // Sharks — player nicknames and spoken variants
  'joe thornton': ['jumbo joe'],
  'patrick marleau': ['patty marleau'],
  'evgeni nabokov': ['nabokov', 'nabby'],
  'macklin celebrini': ['celebrini', 'mack celebrini'],
  'alexander wennberg': ['wennberg', 'alex wennberg'],
  'alex nedeljkovic': ['nedeljkovic'],
  'yaroslav askarov': ['askarov', 'yaroslav'],

  // Sharks — hockey terms
  'power play': ['on the power play', 'man advantage', 'pp goal'],
  'penalty kill': ['on the penalty kill', 'shorthanded'],
  'five hole': ['through the five hole', 'five-hole'],
  'plus-minus': ['plus minus'],
  'odd-man rush': ['odd man rush', 'two on one', 'three on two'],
  'hat trick': ['hat-trick'],
}

/**
 * Detects which card words appear in the transcript.
 * IMPORTANT: Must only be called on isFinal transcript results — never on interim.
 * Calling on interim results causes false positives and duplicate fills.
 */
export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const lower = transcript.toLowerCase()
  const results: string[] = []

  for (const word of cardWords) {
    if (alreadyFilled.has(word)) continue
    const lw = word.toLowerCase()
    const matched = lw.includes(' ')
      ? lower.includes(lw)
      : new RegExp(`\\b${escapeRegex(lw)}\\b`).test(lower)
    if (matched) results.push(word)
  }

  return results
}

export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const lower = transcript.toLowerCase()
  const detected = new Set(detectWords(transcript, cardWords, alreadyFilled))

  for (const word of cardWords) {
    if (alreadyFilled.has(word) || detected.has(word)) continue
    const aliases = WORD_ALIASES[word.toLowerCase()]
    if (!aliases) continue
    for (const alias of aliases) {
      const matched = alias.includes(' ')
        ? lower.includes(alias)
        : new RegExp(`\\b${escapeRegex(alias)}\\b`).test(lower)
      if (matched) {
        detected.add(word)
        break
      }
    }
  }

  return Array.from(detected)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
