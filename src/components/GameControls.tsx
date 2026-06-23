import { Button } from './ui/Button'

interface GameControlsProps {
  isListening: boolean
  isSupported: boolean
  isSilent: boolean
  onToggleListening: () => void
  onNewCard: () => void
}

export function GameControls({
  isListening,
  isSupported,
  isSilent,
  onToggleListening,
  onNewCard,
}: GameControlsProps) {
  return (
    <div className="space-y-2">
      {isSilent && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          No audio detected — is your mic muted?
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onNewCard} className="flex-1">
          🔄 New Card
        </Button>
        {isSupported ? (
          <Button
            variant={isListening ? 'ghost' : 'primary'}
            onClick={onToggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className="flex-1"
          >
            {isListening ? '⏹ Stop' : '🎤 Start Listening'}
          </Button>
        ) : (
          <p className="flex-1 text-xs text-gray-500 flex items-center justify-center">
            Tap squares manually to fill
          </p>
        )}
      </div>
    </div>
  )
}
