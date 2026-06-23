import { useCallback, useEffect, useRef, useState } from 'react'
import type { Toast as ToastType } from '../types'
import { checkForBingo, getClosestToWin } from '../lib/bingoChecker'
import { detectWordsWithAliases } from '../lib/wordDetector'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useGame } from '../hooks/useGame'
import { BingoCard } from './BingoCard'
import { TranscriptPanel } from './TranscriptPanel'
import { GameControls } from './GameControls'
import { WinScreen } from './WinScreen'
import { Toast } from './ui/Toast'
import type { CategoryId } from '../types'
import { CATEGORIES } from '../data/categories'

interface GameBoardProps {
  category: CategoryId
  onExit: () => void
}

export function GameBoard({ category, onExit }: GameBoardProps) {
  const { gameState, fillSquare, setListening, generateNewCard } = useGame()
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [showWin, setShowWin] = useState(true)
  const [detectedWords, setDetectedWords] = useState<string[]>([])
  const nearBingoToastRef = useRef<string | null>(null)

  const addToast = useCallback((msg: string, type: ToastType['type'], persistent = false) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message: msg, type, persistent }])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    if (nearBingoToastRef.current === id) nearBingoToastRef.current = null
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const onSpeechResult = useCallback(
    (finalTranscript: string) => {
      if (!gameState.card || gameState.status === 'won') return

      // Exclude the free space from alreadyFilled — its word string is not a detection target
      const alreadyFilled = new Set(
        gameState.card.squares.flat().filter((s) => s.isFilled && !s.isFreeSpace).map((s) => s.word),
      )
      const matched = detectWordsWithAliases(finalTranscript, gameState.card.words, alreadyFilled)
      if (matched.length === 0) return

      setDetectedWords((prev) => [...prev, ...matched])

      // Track locally which words we fill in this event so we can detect a mid-loop win
      // and stop before showing spurious toasts for words after the game-winning fill.
      const localFilled = new Set(alreadyFilled)
      const flatSquares = gameState.card.squares.flat()

      for (const word of matched) {
        if (localFilled.has(word)) continue
        const sq = flatSquares.find((s) => s.word === word)
        if (!sq || sq.isFilled) continue

        localFilled.add(word)
        fillSquare(sq.row, sq.col, true)
        addToast(`✓ "${word}" detected!`, 'success')

        // Simulate the fill to detect a game-winning square; if so, stop the loop.
        // This prevents spurious toasts for subsequent words in the same isFinal event.
        const simSquares = gameState.card.squares.map((r) =>
          r.map((s) => (localFilled.has(s.word) || s.isFilled ? { ...s, isFilled: true } : s)),
        )
        if (checkForBingo({ ...gameState.card, squares: simSquares })) break
      }
    },
    [gameState, fillSquare, addToast],
  )

  const speech = useSpeechRecognition(onSpeechResult)

  // Dismiss near-bingo toast on win; add it when one square away
  useEffect(() => {
    if (gameState.status === 'won') {
      if (nearBingoToastRef.current) dismissToast(nearBingoToastRef.current)
      return
    }
    if (!gameState.card) return
    const closest = getClosestToWin(gameState.card)
    if (closest?.needed === 1 && !nearBingoToastRef.current) {
      const id = addToast('One away! 🔥', 'warning', true)
      nearBingoToastRef.current = id
    }
  }, [gameState.filledCount, gameState.status, gameState.card, addToast, dismissToast])

  // Show win overlay when won
  useEffect(() => {
    if (gameState.status === 'won') setShowWin(true)
  }, [gameState.status])

  const handleToggleListening = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening()
      setListening(false)
    } else {
      speech.startListening()
      setListening(true)
    }
  }, [speech, setListening])

  const handleNewCard = useCallback(() => {
    speech.stopListening()
    setListening(false)
    speech.resetTranscript()
    setDetectedWords([])
    setToasts([])
    nearBingoToastRef.current = null
    generateNewCard(category)
    setShowWin(false)
  }, [speech, setListening, generateNewCard, category])

  const handleKeepPlaying = useCallback(() => {
    setShowWin(false)
  }, [])

  const handlePlayAgain = useCallback(() => {
    setShowWin(false)
    handleNewCard()
  }, [handleNewCard])

  const catMeta = CATEGORIES.find((c) => c.id === category)

  if (!gameState.card) return null

  const closest = getClosestToWin(gameState.card)
  const nearBingo = closest?.needed === 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {catMeta?.icon} {catMeta?.name ?? 'Meeting Bingo'}
          </h1>
          <p className="text-xs text-gray-500">
            {gameState.filledCount}/25 squares • {speech.isListening ? 'Listening' : 'Paused'}
            {speech.isSupported && (
              <span
                className={`ml-1.5 inline-block w-2 h-2 rounded-full align-middle transition-colors ${
                  speech.isListening ? 'bg-green-500' : 'bg-gray-300'
                }`}
                aria-label={speech.isListening ? 'Microphone active' : 'Microphone inactive'}
              />
            )}
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕ Exit
        </button>
      </header>

      {/* No-speech-support banner */}
      {!speech.isSupported && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700">
          Speech recognition is not available in this browser. Tap squares to fill manually.
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start px-2 py-4 gap-3 max-w-lg mx-auto w-full">
        <BingoCard
          card={gameState.card}
          winningLine={gameState.winningLine}
          nearBingo={nearBingo}
          onSquareClick={(row, col) => fillSquare(row, col, false)}
        />

        <div className="w-full space-y-2">
          <TranscriptPanel
            transcript={speech.transcript}
            interimTranscript={speech.interimTranscript}
            detectedWords={detectedWords}
            isListening={speech.isListening}
          />
          <GameControls
            isListening={speech.isListening}
            isSupported={speech.isSupported}
            isSilent={speech.isSilent}
            onToggleListening={handleToggleListening}
            onNewCard={handleNewCard}
          />
        </div>
      </main>

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-40">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      {/* Win overlay */}
      {gameState.status === 'won' && showWin && (
        <WinScreen
          gameState={gameState}
          onKeepPlaying={handleKeepPlaying}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
