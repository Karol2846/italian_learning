import { itemsById, lessons } from '../content'
import type { Dialogue, Grammar, Item, Lesson, Sentence } from '../content/types'
import { isDue } from './srs'
import type { Progress } from './store'

export type ChooseMode = 'read' | 'listen' | 'recall'

type Body =
  | { kind: 'intro'; item: Item }
  | { kind: 'choose'; item: Item; mode: ChooseMode; options: string[]; review: boolean }
  | { kind: 'type'; item: Item; review: boolean }
  | { kind: 'grammar'; grammar: Grammar }
  | { kind: 'build'; sentence: Sentence; tiles: string[] }
  | { kind: 'dialogue'; dialogue: Dialogue }

/** `section` names the stage of the session; the progress bar is split by it. */
export type Exercise = Body & { section: string }

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function choose(item: Item, mode: ChooseMode, pool: Item[], review = false): Body {
  const field = mode === 'recall' ? 'it' : 'pl'
  const wrong = [...new Set(shuffle(pool).map((i) => i[field]))].filter((t) => t !== item[field]).slice(0, 3)
  return { kind: 'choose', item, mode, options: shuffle([item[field], ...wrong]), review }
}

export const words = (s: string) => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean)

function build(sentence: Sentence, lesson: Lesson): Body {
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

function reviewExercise(item: Item, p: Progress, pool: Item[]): Body {
  const box = p.cards[item.id]?.box ?? 1
  if (box >= 2 && canWrite(p)) return { kind: 'type', item, review: true }
  return choose(item, Math.random() < 0.5 ? 'listen' : 'recall', pool, true)
}

const inSection = (section: string, body: Body[]): Exercise[] => body.map((b) => ({ ...b, section }))

export function buildReviewSession(p: Progress, limit = 20): Exercise[] {
  const pool = knownItems(p)
  return inSection(
    'Powtórki',
    shuffle(dueItems(p))
      .slice(0, limit)
      .map((i) => reviewExercise(i, p, pool)),
  )
}

/** Splits a lesson's words into `parts` contiguous chunks of near-equal size. */
export function partItems(lesson: Lesson, part: number, parts: number): Item[] {
  const size = Math.ceil(lesson.items.length / parts)
  return lesson.items.slice(part * size, (part + 1) * size)
}

/**
 * One sitting of a lesson. Words come in groups of three (meet → read →
 * listen) with old material woven in between, then recall and, if unlocked,
 * writing. The last part adds grammar, sentences and the dialogue, which
 * draw on the words of the whole lesson.
 */
export function buildLessonSession(lesson: Lesson, p: Progress, part = 0, parts = 1): Exercise[] {
  const items = partItems(lesson, part, parts)
  const own = new Set(lesson.items.map((i) => i.id))
  const pool = [...knownItems(p).filter((i) => !own.has(i.id)), ...lesson.items]
  const reviews = shuffle(dueItems(p).filter((i) => !items.includes(i))).slice(0, 6)

  const learn: Body[] = []
  for (let i = 0; i < items.length; i += 3) {
    const group = items.slice(i, i + 3)
    learn.push(...group.map((item): Body => ({ kind: 'intro', item })))
    learn.push(...shuffle(group).map((item) => choose(item, 'read', pool)))
    learn.push(...shuffle(group).map((item) => choose(item, 'listen', pool)))
    learn.push(...reviews.splice(0, 2).map((item) => reviewExercise(item, p, pool)))
  }

  const drill: Body[] = shuffle(items).map((item) => choose(item, 'recall', pool))
  if (lesson.skills.includes('write')) {
    drill.push(...shuffle(items).map((item): Body => ({ kind: 'type', item, review: false })))
  }

  const out = [...inSection('Nowe słówka', learn), ...inSection('Utrwalanie', drill)]
  if (part === parts - 1) {
    out.push(
      { kind: 'grammar', grammar: lesson.grammar, section: 'Gramatyka' },
      ...inSection('Zdania', lesson.sentences.map((s) => build(s, lesson))),
      { kind: 'dialogue', dialogue: lesson.dialogue, section: 'Dialog' },
    )
  }
  return out
}
