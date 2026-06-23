import type { BingoCard as BingoCardType, WinningLine } from '../types'
import { BingoSquare } from './BingoSquare'

interface BingoCardProps {
  card: BingoCardType
  winningLine: WinningLine | null
  nearBingo: boolean
  onSquareClick: (row: number, col: number) => void
}

export function BingoCard({ card, winningLine, nearBingo, onSquareClick }: BingoCardProps) {
  const winningIds = new Set(winningLine?.squares ?? [])

  return (
    <div
      role="grid"
      aria-label="Bingo card"
      className={`grid grid-cols-5 gap-1 p-2 rounded-xl transition-all ${
        nearBingo ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
      }`}
    >
      {card.squares.map((row, ri) => (
        <div key={ri} role="row" className="contents">
          {row.map((square) => (
            <BingoSquare
              key={square.id}
              square={square}
              isWinningSquare={winningIds.has(square.id)}
              onClick={() => onSquareClick(square.row, square.col)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
