import type { Card } from './srs'

export interface Progress {
  cards: Record<string, Card>
  lessonsDone: string[]
}

const KEY = 'italiano.progress.v1'

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { cards: {}, lessonsDone: [], ...JSON.parse(raw) }
  } catch {
    // Unreadable or blocked storage: start fresh rather than crash.
  }
  return { cards: {}, lessonsDone: [] }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Private mode / full storage: progress lives for this session only.
  }
}
