import { useState } from 'react'

interface TranscriptPanelProps {
  transcript: string
  interimTranscript: string
  detectedWords: string[]
  isListening: boolean
}

export function TranscriptPanel({
  transcript,
  interimTranscript,
  detectedWords,
  isListening,
}: TranscriptPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const recent = transcript.slice(-100)
  const lastFive = detectedWords.slice(-5)
  const panelId = 'transcript-panel-content'

  return (
    <div
      aria-live="polite"
      aria-label="Live transcript"
      className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* Mobile collapsed toggle */}
      <button
        className="sm:hidden w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span>{isListening ? '🎤 Listening…' : '🎤 Paused'}</span>
        <span
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {/* Full panel — always visible on sm+, toggle on mobile */}
      <div
        id={panelId}
        className={`px-3 py-2 space-y-1.5 ${expanded ? 'block' : 'hidden'} sm:block`}
      >
        {recent || interimTranscript ? (
          <p className="text-xs text-gray-500 leading-snug">
            <span className="text-gray-800">{recent}</span>
            {interimTranscript && (
              <span className="text-gray-400 italic"> {interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            {isListening ? 'Listening for buzzwords…' : 'Start listening to see transcript'}
          </p>
        )}
        {lastFive.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lastFive.map((w, i) => (
              <span
                key={`${w}-${i}`}
                className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
              >
                ✨ {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
