import type { BingoCard, WinningLine } from '../types'

function getLineSquareIds(
  card: BingoCard,
  type: WinningLine['type'],
  index: number,
): string[] {
  if (type === 'row') {
    return card.squares[index].map((sq) => sq.id)
  }
  if (type === 'col') {
    return card.squares.map((row) => row[index].id)
  }
  // diagonal
  if (index === 0) {
    return [0, 1, 2, 3, 4].map((i) => card.squares[i][i].id)
  }
  return [0, 1, 2, 3, 4].map((i) => card.squares[i][4 - i].id)
}

function isLineFilled(card: BingoCard, type: WinningLine['type'], index: number): boolean {
  if (type === 'row') {
    return card.squares[index].every((sq) => sq.isFilled)
  }
  if (type === 'col') {
    return card.squares.every((row) => row[index].isFilled)
  }
  if (index === 0) {
    return [0, 1, 2, 3, 4].every((i) => card.squares[i][i].isFilled)
  }
  return [0, 1, 2, 3, 4].every((i) => card.squares[i][4 - i].isFilled)
}

function countUnfilled(card: BingoCard, type: WinningLine['type'], index: number): number {
  if (type === 'row') {
    return card.squares[index].filter((sq) => !sq.isFilled).length
  }
  if (type === 'col') {
    return card.squares.filter((row) => !row[index].isFilled).length
  }
  if (index === 0) {
    return [0, 1, 2, 3, 4].filter((i) => !card.squares[i][i].isFilled).length
  }
  return [0, 1, 2, 3, 4].filter((i) => !card.squares[i][4 - i].isFilled).length
}

export function checkForBingo(card: BingoCard): WinningLine | null {
  for (let i = 0; i < 5; i++) {
    if (isLineFilled(card, 'row', i)) {
      return { type: 'row', index: i, squares: getLineSquareIds(card, 'row', i) }
    }
  }
  for (let i = 0; i < 5; i++) {
    if (isLineFilled(card, 'col', i)) {
      return { type: 'col', index: i, squares: getLineSquareIds(card, 'col', i) }
    }
  }
  for (let i = 0; i < 2; i++) {
    if (isLineFilled(card, 'diagonal', i)) {
      return { type: 'diagonal', index: i, squares: getLineSquareIds(card, 'diagonal', i) }
    }
  }
  return null
}

export function countFilled(card: BingoCard): number {
  return card.squares.flat().filter((sq) => sq.isFilled).length
}

export function getClosestToWin(
  card: BingoCard,
): { needed: number; line: WinningLine } | null {
  let best: { needed: number; line: WinningLine } | null = null

  const check = (type: WinningLine['type'], index: number) => {
    const needed = countUnfilled(card, type, index)
    if (needed === 0) return // already won
    if (best === null || needed < best.needed) {
      best = { needed, line: { type, index, squares: getLineSquareIds(card, type, index) } }
    }
  }

  for (let i = 0; i < 5; i++) check('row', i)
  for (let i = 0; i < 5; i++) check('col', i)
  for (let i = 0; i < 2; i++) check('diagonal', i)

  return best
}
