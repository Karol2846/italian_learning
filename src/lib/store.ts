import type { Exercise } from './session'
import type { Card } from './srs'

export interface Progress {
  cards: Record<string, Card>
  lessonsDone: string[]
  /** Lessons being taken in several sittings: how many parts, how many finished. */
  partial: Record<string, { parts: number; done: number }>
}

/** A session in flight, saved after every step so leaving the app loses nothing. */
export interface SavedSession {
  title: string
  lessonId?: string
  part: number
  parts: number
  queue: Exercise[]
  pos: number
  results: Record<string, boolean>
}

const KEY = 'italiano.progress.v1'
const SESSION_KEY = 'italiano.session.v1'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    // Unreadable or blocked storage: behave as if nothing was saved.
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode / full storage: state lives for this page load only.
  }
}

export const loadProgress = (): Progress => ({ cards: {}, lessonsDone: [], partial: {}, ...read<Partial<Progress>>(KEY) })
export const saveProgress = (p: Progress) => write(KEY, p)

export const loadSession = () => read<SavedSession>(SESSION_KEY)
export const saveSession = (s: SavedSession | null) => write(SESSION_KEY, s)

export interface Settings {
  /** Show IPA transcriptions next to Italian words. */
  ipa: boolean
}

const SETTINGS_KEY = 'italiano.settings.v1'
export const loadSettings = (): Settings => ({ ipa: false, ...read<Partial<Settings>>(SETTINGS_KEY) })
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s)
