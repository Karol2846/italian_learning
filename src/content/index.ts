import type { Item, Lesson, Unit } from './types'
import { unit01 } from './unit01'

export const units: Unit[] = [unit01]

export const lessons: Lesson[] = units.flatMap((u) => u.lessons)

export const itemsById = new Map<string, Item>(lessons.flatMap((l) => l.items).map((i) => [i.id, i]))
