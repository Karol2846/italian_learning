import type { Item, Lesson, Unit } from './types'
import { unit01 } from './unit01'
import { unit02 } from './unit02'
import { unit03 } from './unit03'

export const units: Unit[] = [unit01, unit02, unit03]

export const lessons: Lesson[] = units.flatMap((u) => u.lessons)

export const itemsById = new Map<string, Item>(lessons.flatMap((l) => l.items).map((i) => [i.id, i]))
