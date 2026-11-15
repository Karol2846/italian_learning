import { expect, test } from 'vitest'
import { checkAnswer } from './check'

test('ignores case, punctuation and extra spaces', () => {
  expect(checkAnswer('  Come  stai ', ['come stai?'])).toBe('correct')
  expect(checkAnswer('Sì, grazie!', ['Sì, grazie'])).toBe('correct')
})

test('missing or wrong accent is a mistake of its own kind', () => {
  expect(checkAnswer('si', ['sì'])).toBe('accents')
  expect(checkAnswer('cosi cosi', ['così così'])).toBe('accents')
})

test('typos are wrong', () => {
  expect(checkAnswer('buongorno', ['buongiorno'])).toBe('wrong')
  expect(checkAnswer('gracie', ['grazie'])).toBe('wrong')
})

test('accepts listed alternatives and curly apostrophes', () => {
  expect(checkAnswer('stanca', ['stanco', 'stanca'])).toBe('correct')
  expect(checkAnswer('un po’', ["un po'"])).toBe('correct')
})
