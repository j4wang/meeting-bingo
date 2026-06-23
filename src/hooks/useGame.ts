import { useCallback } from 'react'
import type { CategoryId, GameState } from '../types'
import { generateCard } from '../lib/cardGenerator'
import { checkForBingo, countFilled } from '../lib/bingoChecker'
import { useLocalStorage } from './useLocalStorage'

const SCHEMA_VERSION = 1

export const DEFAULT_GAME_STATE: GameState = {
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
  filledCount: 0,
  schemaVersion: SCHEMA_VERSION,
}

export function useGame() {
  const [gameState, setGameState] = useLocalStorage<GameState>(
    'meeting-bingo-game',
    DEFAULT_GAME_STATE,
  )

  const startGame = useCallback(
    (categoryId: CategoryId) => {
      const card = generateCard(categoryId)
      setGameState({
        ...DEFAULT_GAME_STATE,
        status: 'playing',
        category: categoryId,
        card,
        startedAt: new Date().toISOString(),
        filledCount: 1, // free space
        schemaVersion: SCHEMA_VERSION,
      })
    },
    [setGameState],
  )

  const fillSquare = useCallback(
    (row: number, col: number, isAuto: boolean) => {
      setGameState((prev) => {
        if (prev.status === 'won' || !prev.card) return prev

        const square = prev.card.squares[row][col]
        if (square.isFreeSpace || square.isFilled) return prev

        const newSquares = prev.card.squares.map((r, ri) =>
          r.map((sq, ci) => {
            if (ri === row && ci === col) {
              return { ...sq, isFilled: true, isAutoFilled: isAuto, filledAt: new Date().toISOString() }
            }
            return sq
          }),
        )
        const newCard = { ...prev.card, squares: newSquares }
        const winningLine = checkForBingo(newCard)
        const filled = countFilled(newCard)

        if (winningLine) {
          return {
            ...prev,
            card: newCard,
            filledCount: filled,
            status: 'won',
            completedAt: new Date().toISOString(),
            winningLine,
            winningWord: square.word,
          }
        }
        return { ...prev, card: newCard, filledCount: filled }
      })
    },
    [setGameState],
  )

  const unfillSquare = useCallback(
    (row: number, col: number) => {
      setGameState((prev) => {
        if (!prev.card) return prev
        const square = prev.card.squares[row][col]
        if (square.isFreeSpace || !square.isFilled) return prev

        const newSquares = prev.card.squares.map((r, ri) =>
          r.map((sq, ci) => {
            if (ri === row && ci === col) {
              return { ...sq, isFilled: false, isAutoFilled: false, filledAt: null }
            }
            return sq
          }),
        )
        const newCard = { ...prev.card, squares: newSquares }
        return { ...prev, card: newCard, filledCount: countFilled(newCard) }
      })
    },
    [setGameState],
  )

  const setListening = useCallback(
    (isListening: boolean) => {
      setGameState((prev) => ({ ...prev, isListening }))
    },
    [setGameState],
  )

  const generateNewCard = useCallback(
    (categoryId: CategoryId) => {
      startGame(categoryId)
    },
    [startGame],
  )

  const resetGame = useCallback(() => {
    setGameState({ ...DEFAULT_GAME_STATE, schemaVersion: SCHEMA_VERSION })
  }, [setGameState])

  const dismissWin = useCallback(() => {
    // keep game in 'won' but allow interaction — WinScreen overlay is hidden by caller
  }, [])

  const restoreGame = useCallback(
    (state: GameState) => {
      setGameState({ ...state, isListening: false })
    },
    [setGameState],
  )

  return {
    gameState,
    startGame,
    fillSquare,
    unfillSquare,
    setListening,
    generateNewCard,
    resetGame,
    dismissWin,
    restoreGame,
    SCHEMA_VERSION,
  }
}
