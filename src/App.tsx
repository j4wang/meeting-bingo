import { useCallback, useEffect, useState } from 'react'
import type { CategoryId, GameState } from './types'
import { useGame } from './hooks/useGame'
import { LandingPage } from './components/LandingPage'
import { CategorySelect } from './components/CategorySelect'
import { GameBoard } from './components/GameBoard'
import { Button } from './components/ui/Button'
import { STORAGE_KEY, SCHEMA_VERSION } from './lib/constants'

type Screen = 'landing' | 'category' | 'game'

function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (
      parsed.schemaVersion === SCHEMA_VERSION &&
      parsed.status === 'playing' &&
      parsed.card !== null &&
      parsed.category !== null
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [pendingResume, setPendingResume] = useState<GameState | null>(null)
  const { startGame, restoreGame, resetGame } = useGame()

  useEffect(() => {
    const saved = loadSavedGame()
    if (saved) setPendingResume(saved)
  }, [])

  const handleResume = useCallback(() => {
    if (!pendingResume) return
    restoreGame(pendingResume)
    setCategory(pendingResume.category)
    setPendingResume(null)
    setScreen('game')
  }, [pendingResume, restoreGame])

  const handleDeclineResume = useCallback(() => {
    resetGame()
    setPendingResume(null)
  }, [resetGame])

  const handleCategorySelect = useCallback(
    (cat: CategoryId) => {
      setCategory(cat)
      startGame(cat)
      setScreen('game')
    },
    [startGame],
  )

  const handleExit = useCallback(() => {
    setScreen('landing')
    setCategory(null)
  }, [])

  if (pendingResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center space-y-5">
          <div className="text-4xl">🎯</div>
          <h2 className="text-xl font-bold text-gray-900">Resume your game?</h2>
          <p className="text-sm text-gray-500">
            You have a game in progress. {(pendingResume.filledCount ?? 1) - 1} squares filled.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleDeclineResume}>
              New Game
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleResume}>
              Resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'landing') {
    return <LandingPage onStart={() => setScreen('category')} />
  }

  if (screen === 'category') {
    return (
      <CategorySelect onSelect={handleCategorySelect} onBack={() => setScreen('landing')} />
    )
  }

  if (screen === 'game' && category) {
    return <GameBoard category={category} onExit={handleExit} />
  }

  return <LandingPage onStart={() => setScreen('category')} />
}
