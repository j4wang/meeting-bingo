// Locale: hardcoded for en-US. WORD_ALIASES in wordDetector.ts covers common spoken variants
// for US English. Non-US English speakers may experience lower detection accuracy.
// lang is set to 'en-US' on the SpeechRecognition instance below.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpeechRecognitionState } from '../types'

const SILENCE_TIMEOUT_MS = 10_000

// Minimal SpeechRecognition interface — the DOM lib exposes it but not all TS configs surface it
interface SR {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult:
    | ((event: {
        resultIndex: number
        results: { isFinal: boolean; 0: { transcript: string } }[] & { length: number }
      }) => void)
    | null
  start(): void
  stop(): void
  abort(): void
}

function isIOS(): boolean {
  return /(iPad|iPhone|iPod)/i.test(navigator.userAgent)
}

type OnResultCallback = (finalTranscript: string) => void

export function useSpeechRecognition(onResult: OnResultCallback): SpeechRecognitionState & {
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
} {
  const [state, setState] = useState<SpeechRecognitionState>({
    isSupported: false,
    isListening: false,
    isSilent: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  })

  const recognitionRef = useRef<SR | null>(null)
  const isListeningRef = useRef(false)
  const isRestartingRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        setState((prev) => ({ ...prev, isSilent: true }))
        recognitionRef.current?.stop()
        isListeningRef.current = false
      }
    }, SILENCE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    type SpeechRecognitionCtor = new () => SR
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition

    if (!SpeechRecognitionAPI || isIOS()) {
      setState((prev) => ({ ...prev, isSupported: false }))
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    setState((prev) => ({ ...prev, isSupported: true }))

    recognition.onstart = () => {
      isRestartingRef.current = false
      setState((prev) => ({ ...prev, isListening: true, isSilent: false, error: null }))
      resetSilenceTimer()
    }

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false, interimTranscript: '' }))
      if (isListeningRef.current && !isRestartingRef.current) {
        isRestartingRef.current = true
        try {
          recognition.start()
        } catch {
          // swallow InvalidStateError — Chrome bug
          isRestartingRef.current = false
        }
      }
    }

    recognition.onresult = (event) => {
      clearSilenceTimer()
      setState((prev) => ({ ...prev, isSilent: false }))
      resetSilenceTimer()

      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setState((prev) => ({
          ...prev,
          transcript: (prev.transcript + ' ' + finalText).slice(-500).trim(),
          interimTranscript: '',
        }))
        onResultRef.current(finalText)
      }

      if (interimText) {
        setState((prev) => ({ ...prev, interimTranscript: interimText }))
      }
    }

    recognition.onerror = (event) => {
      const error = event.error
      setState((prev) => ({ ...prev, error }))
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        isListeningRef.current = false
        clearSilenceTimer()
      }
    }

    return () => {
      isListeningRef.current = false
      clearSilenceTimer()
      recognition.abort()
    }
  }, [resetSilenceTimer])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    isListeningRef.current = true
    isRestartingRef.current = true
    try {
      recognitionRef.current.start()
    } catch {
      isRestartingRef.current = false
    }
  }, [])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    clearSilenceTimer()
    setState((prev) => ({ ...prev, isListening: false, interimTranscript: '' }))
    try {
      recognitionRef.current?.stop()
    } catch {
      // already stopped
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }))
  }, [])

  return { ...state, startListening, stopListening, resetTranscript }
}
