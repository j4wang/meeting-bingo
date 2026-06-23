export interface BingoSquare {
  id: string
  word: string
  isFilled: boolean
  isAutoFilled: boolean
  isFreeSpace: boolean
  filledAt: string | null
  row: number
  col: number
}

export interface BingoCard {
  squares: BingoSquare[][]
  words: string[]
}

export type CategoryId = 'agile' | 'corporate' | 'tech'

export interface GameState {
  status: 'idle' | 'playing' | 'won'
  category: CategoryId | null
  card: BingoCard | null
  isListening: boolean
  startedAt: string | null
  completedAt: string | null
  winningLine: WinningLine | null
  winningWord: string | null
  filledCount: number
  schemaVersion: number
}

export interface WinningLine {
  type: 'row' | 'col' | 'diagonal'
  index: number
  squares: string[]
}

export interface SpeechRecognitionState {
  isSupported: boolean
  isListening: boolean
  isSilent: boolean
  transcript: string
  interimTranscript: string
  detectedWords: string[]
  error: string | null
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning'
  persistent: boolean
}

export interface BuzzwordCategory {
  id: CategoryId
  name: string
  description: string
  icon: string
  words: string[]
}
