import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import type { GameState } from '../types'
import { shareResult } from '../lib/shareUtils'
import { Button } from './ui/Button'

interface WinScreenProps {
  gameState: GameState
  onKeepPlaying: () => void
  onPlayAgain: () => void
}

function formatElapsed(start: string | null, end: string | null): string {
  if (!start || !end) return '--:--'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const totalSecs = Math.floor(ms / 1000)
  const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0')
  const ss = String(totalSecs % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function describeWinLine(game: GameState): string {
  const line = game.winningLine
  if (!line) return ''
  if (line.type === 'row') return `Row ${line.index + 1}`
  if (line.type === 'col') return `Column ${line.index + 1}`
  return line.index === 0 ? 'Top-left diagonal' : 'Top-right diagonal'
}

export function WinScreen({ gameState, onKeepPlaying, onPlayAgain }: WinScreenProps) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const end = Date.now() + 2500
    const fire = () => {
      if (Date.now() > end) return
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.5 },
        disableForReducedMotion: true,
      })
      requestAnimationFrame(fire)
    }
    fire()
  }, [])

  const elapsed = formatElapsed(gameState.startedAt, gameState.completedAt)
  const filled = (gameState.filledCount ?? 0) - 1 // exclude free space
  const winLine = describeWinLine(gameState)

  const handleShare = async () => {
    const outcome = await shareResult(gameState)
    if (!outcome.success) {
      // show fallback text inline — no audio, no alert
      const el = document.getElementById('share-fallback')
      if (el) {
        el.textContent = outcome.text
        el.hidden = false
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bingo! You won"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-5">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900">BINGO!</h2>
        {gameState.winningWord && (
          <p className="text-gray-500">
            "{gameState.winningWord}" sealed the deal!
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{elapsed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Time</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{filled}</div>
            <div className="text-xs text-gray-500 mt-0.5">Squares</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-purple-600 leading-tight">{winLine}</div>
            <div className="text-xs text-gray-500 mt-0.5">Win</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={handleShare}>
            📤 Share Result
          </Button>
          <pre
            id="share-fallback"
            hidden
            className="text-left text-xs bg-gray-100 rounded p-3 whitespace-pre-wrap break-words"
          />
        </div>

        <hr className="border-gray-100" />

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onKeepPlaying}>
            Keep Playing
          </Button>
          <Button variant="primary" className="flex-1" onClick={onPlayAgain}>
            Play Again
          </Button>
        </div>
      </div>
    </div>
  )
}
