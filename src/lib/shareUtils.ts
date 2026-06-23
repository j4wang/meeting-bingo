import type { GameState, WinningLine } from '../types'
import { CATEGORIES } from '../data/categories'

type ShareOutcome =
  | { success: true; method: 'share' | 'clipboard' }
  | { success: false; text: string }

function formatElapsed(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '--:--'
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatLine(line: WinningLine): string {
  if (line.type === 'row') return `Row ${line.index + 1}`
  if (line.type === 'col') return `Column ${line.index + 1}`
  return line.index === 0 ? 'Top-left diagonal' : 'Top-right diagonal'
}

function buildShareText(game: GameState): string {
  const categoryName =
    CATEGORIES.find((c) => c.id === game.category)?.name ?? game.category ?? 'Unknown'
  const elapsed = formatElapsed(game.startedAt, game.completedAt)
  const filled = game.filledCount
  const line = game.winningLine ? formatLine(game.winningLine) : 'Unknown'

  return [
    `Meeting Bingo — ${categoryName} 🎯`,
    `BINGO in ${elapsed} • ${filled}/24 squares filled`,
    `Winning line: ${line}`,
    `(played with Meeting Bingo — audio never recorded)`,
  ].join('\n')
}

export async function shareResult(game: GameState): Promise<ShareOutcome> {
  const text = buildShareText(game)

  if (navigator.share) {
    try {
      await navigator.share({ text })
      return { success: true, method: 'share' }
    } catch {
      // fall through to clipboard
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true, method: 'clipboard' }
    } catch {
      // fall through to inline fallback
    }
  }

  return { success: false, text }
}
