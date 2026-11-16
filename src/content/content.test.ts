import { expect, test } from 'vitest'
import { lessons } from '.'
import { normalize } from '../lib/check'
import { buildLessonSession, words } from '../lib/session'

const items = lessons.flatMap((l) => l.items)

test('item ids and Italian texts are unique across the course', () => {
  expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  expect(new Set(items.map((i) => i.it)).size).toBe(items.length)
})

test('every item has a transcription and every question a valid answer', () => {
  for (const i of items) expect(i.ipa, i.id).toBeTruthy()
  for (const l of lessons) {
    for (const q of l.dialogue.questions) expect(q.options[q.answer], l.id).toBeDefined()
  }
})

test.each(lessons.map((l) => [l.id, l] as const))('lesson %s builds a solvable session', (_, lesson) => {
  const done = lessons.slice(0, lessons.indexOf(lesson)).map((l) => l.id)
  const session = buildLessonSession(lesson, { cards: {}, lessonsDone: done, partial: {} })
  for (const ex of session) {
    if (ex.kind === 'choose') {
      const right = ex.mode === 'recall' ? ex.item.it : ex.item.pl
      expect(ex.options).toContain(right)
      expect(new Set(ex.options).size).toBe(4)
    }
    if (ex.kind === 'build') {
      const pool = [...ex.tiles]
      for (const w of words(ex.sentence.it)) {
        const at = pool.indexOf(w)
        expect(at, `${w} in ${ex.sentence.it}`).toBeGreaterThanOrEqual(0)
        pool.splice(at, 1)
      }
      expect(normalize(words(ex.sentence.it).join(' '))).toBe(normalize(ex.sentence.it))
    }
  }
  expect(session.at(-1)?.kind).toBe('dialogue')
})
