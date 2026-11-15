import { itemsById, lessons } from '../content'
import type { Dialogue, Grammar, Item, Lesson, Sentence } from '../content/types'
import { isDue } from './srs'
import type { Progress } from './store'

export type ChooseMode = 'read' | 'listen' | 'recall'

export type Exercise =
  | { kind: 'intro'; item: Item }
  | { kind: 'choose'; item: Item; mode: ChooseMode; options: string[]; review: boolean }
  | { kind: 'type'; item: Item; review: boolean }
  | { kind: 'grammar'; grammar: Grammar }
  | { kind: 'build'; sentence: Sentence; tiles: string[] }
  | { kind: 'dialogue'; dialogue: Dialogue }

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function choose(item: Item, mode: ChooseMode, pool: Item[], review = false): Exercise {
  const field = mode === 'recall' ? 'it' : 'pl'
  const wrong = [...new Set(shuffle(pool).map((i) => i[field]))].filter((t) => t !== item[field]).slice(0, 3)
  return { kind: 'choose', item, mode, options: shuffle([item[field], ...wrong]), review }
}

export const words = (s: string) => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean)

function build(sentence: Sentence, lesson: Lesson): Exercise {
  const own = words(sentence.it)
  const lower = new Set(own.map((w) => w.toLowerCase()))
  const extra = shuffle(lesson.sentences.flatMap((s) => words(s.it)))
    .filter((w) => !lower.has(w.toLowerCase()))
    .slice(0, 2)
  return { kind: 'build', sentence, tiles: shuffle([...own, ...extra]) }
}

const knownItems = (p: Progress): Item[] =>
  lessons.filter((l) => p.lessonsDone.includes(l.id)).flatMap((l) => l.items)

const canWrite = (p: Progress) => lessons.some((l) => p.lessonsDone.includes(l.id) && l.skills.includes('write'))

export function dueItems(p: Progress): Item[] {
  return Object.entries(p.cards)
    .filter(([, card]) => isDue(card))
    .map(([id]) => itemsById.get(id))
    .filter((i): i is Item => !!i)
}

function reviewExercise(item: Item, p: Progress, pool: Item[]): Exercise {
  const box = p.cards[item.id]?.box ?? 1
  if (box >= 2 && canWrite(p)) return { kind: 'type', item, review: true }
  return choose(item, Math.random() < 0.5 ? 'listen' : 'recall', pool, true)
}

export function buildReviewSession(p: Progress, limit = 20): Exercise[] {
  const pool = knownItems(p)
  return shuffle(dueItems(p))
    .slice(0, limit)
    .map((i) => reviewExercise(i, p, pool))
}

/**
 * Words in groups of three (meet → read → listen), old material woven in
 * between groups, then recall, writing if unlocked, grammar, sentences, dialogue.
 */
export function buildLessonSession(lesson: Lesson, p: Progress): Exercise[] {
  const own = new Set(lesson.items.map((i) => i.id))
  const pool = [...knownItems(p).filter((i) => !own.has(i.id)), ...lesson.items]
  const reviews = shuffle(dueItems(p).filter((i) => !own.has(i.id))).slice(0, 6)
  const out: Exercise[] = []

  for (let i = 0; i < lesson.items.length; i += 3) {
    const group = lesson.items.slice(i, i + 3)
    out.push(...group.map((item): Exercise => ({ kind: 'intro', item })))
    out.push(...shuffle(group).map((item) => choose(item, 'read', pool)))
    out.push(...shuffle(group).map((item) => choose(item, 'listen', pool)))
    out.push(...reviews.splice(0, 2).map((item) => reviewExercise(item, p, pool)))
  }

  out.push(...shuffle(lesson.items).map((item) => choose(item, 'recall', pool)))
  out.push({ kind: 'grammar', grammar: lesson.grammar })
  if (lesson.skills.includes('write')) {
    out.push(...shuffle(lesson.items).map((item): Exercise => ({ kind: 'type', item, review: false })))
  }
  out.push(...lesson.sentences.map((s) => build(s, lesson)))
  out.push({ kind: 'dialogue', dialogue: lesson.dialogue })
  return out
}
