import { useEffect, useRef } from 'react'
import type { BingoSquare as BingoSquareType } from '../types'

interface BingoSquareProps {
  square: BingoSquareType
  isWinningSquare: boolean
  onClick: () => void
}

function getClasses(square: BingoSquareType, isWinningSquare: boolean): string {
  const base =
    'relative flex flex-col items-center justify-center text-center p-1 rounded-lg border-2 transition-colors min-h-[44px] min-w-[44px] w-full aspect-square cursor-pointer select-none text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'

  if (square.isFreeSpace) {
    return `${base} bg-amber-400 border-amber-500 text-white cursor-default`
  }
  if (isWinningSquare) {
    return `${base} bg-green-500 border-green-400 text-white ring-2 ring-green-300 ring-offset-1`
  }
  if (square.isFilled) {
    return `${base} bg-blue-600 border-blue-500 text-white`
  }
  return `${base} bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50`
}

function getIcon(square: BingoSquareType, isWinningSquare: boolean): string {
  if (square.isFreeSpace) return '★'
  if (isWinningSquare) return '🏆'
  if (square.isFilled) return '✓'
  return ''
}

export function BingoSquare({ square, isWinningSquare, onClick }: BingoSquareProps) {
  const animatingRef = useRef(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!square.isAutoFilled || animatingRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    animatingRef.current = true
    btnRef.current?.classList.add('animate-fillPop')
    const t = setTimeout(() => {
      btnRef.current?.classList.remove('animate-fillPop')
      animatingRef.current = false
    }, 250)
    return () => clearTimeout(t)
  }, [square.isAutoFilled, square.isFilled])

  const icon = getIcon(square, isWinningSquare)
  const label = square.isFreeSpace
    ? 'Free space — filled'
    : `${square.word} — ${square.isFilled ? 'filled' : 'not filled'}`

  return (
    <div role="gridcell">
      <button
        ref={btnRef}
        className={getClasses(square, isWinningSquare)}
        onClick={square.isFreeSpace ? undefined : onClick}
        disabled={square.isFreeSpace}
        aria-pressed={square.isFilled}
        aria-label={label}
      >
        {icon && (
          <span className="block text-base leading-none mb-0.5" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="leading-tight break-words w-full">{square.word}</span>
      </button>
    </div>
  )
}
