import { expect, test } from 'vitest'
import { isDue, review, schedule } from './srs'

test('correct answers space reviews further apart', () => {
  let card = schedule(1, 100)
  expect(card.due).toBe(101)
  card = review(card, true, 101)
  expect(card).toEqual({ box: 2, due: 104 })
  card = review(card, true, 104)
  expect(card).toEqual({ box: 3, due: 111 })
})

test('a mistake resets to the first box', () => {
  expect(review({ box: 5, due: 100 }, false, 100)).toEqual({ box: 1, due: 101 })
})

test('box is capped and due is inclusive', () => {
  expect(review({ box: 6, due: 100 }, true, 100).box).toBe(6)
  expect(isDue({ box: 1, due: 100 }, 100)).toBe(true)
  expect(isDue({ box: 1, due: 101 }, 100)).toBe(false)
})
