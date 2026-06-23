import { useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const next = value instanceof Function ? value(storedValue) : value
      setStoredValue(next)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // quota exceeded or private browsing — continue with in-memory state
    }
  }

  return [storedValue, setValue]
}
