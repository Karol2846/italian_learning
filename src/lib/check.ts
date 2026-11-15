export type Verdict = 'correct' | 'accents' | 'wrong'

/** Case, surrounding punctuation and spacing don't count; every letter does. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?;:"„”«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Strict check: the answer must match one of the accepted spellings exactly.
 * 'accents' means only diacritics differ — still a mistake, but worth naming.
 */
export function checkAnswer(input: string, accepted: string[]): Verdict {
  const given = normalize(input)
  const targets = accepted.map(normalize)
  if (targets.includes(given)) return 'correct'
  if (targets.some((t) => stripAccents(t) === stripAccents(given))) return 'accents'
  return 'wrong'
}
