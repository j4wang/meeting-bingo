import { CATEGORIES } from '../data/categories'
import type { BingoCard, BingoSquare, CategoryId } from '../types'

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateCard(categoryId: CategoryId): BingoCard {
  const category = CATEGORIES.find((c) => c.id === categoryId)!
  const picked = shuffle(category.words).slice(0, 24)

  const squares: BingoSquare[][] = []
  let wordIndex = 0

  for (let row = 0; row < 5; row++) {
    squares[row] = []
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        squares[row][col] = {
          id: 'sq-2-2',
          word: 'FREE',
          isFilled: true,
          isAutoFilled: false,
          isFreeSpace: true,
          filledAt: new Date().toISOString(),
          row: 2,
          col: 2,
        }
      } else {
        squares[row][col] = {
          id: `sq-${row}-${col}`,
          word: picked[wordIndex++],
          isFilled: false,
          isAutoFilled: false,
          isFreeSpace: false,
          filledAt: null,
          row,
          col,
        }
      }
    }
  }

  return { squares, words: picked }
}

export function getCardWords(card: BingoCard): string[] {
  return card.words
}
