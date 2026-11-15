export interface Card {
  /** 1..6; higher means better known. */
  box: number
  /** Day number (days since epoch, local time) when the card is next due. */
  due: number
}

/** Days until the next review, by box. */
const INTERVALS = [0, 1, 3, 7, 16, 35, 90]
const MAX_BOX = INTERVALS.length - 1

export function today(now = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000)
}

export function schedule(box: number, day = today()): Card {
  const b = Math.min(Math.max(box, 1), MAX_BOX)
  return { box: b, due: day + INTERVALS[b] }
}

/** A right answer promotes one box; a wrong one sends the card back to the start. */
export function review(card: Card, correct: boolean, day = today()): Card {
  return schedule(correct ? card.box + 1 : 1, day)
}

export const isDue = (card: Card, day = today()) => card.due <= day
