export type Skill = 'read' | 'listen' | 'write' | 'speak'

/** A word or short phrase to memorise. */
export interface Item {
  id: string
  it: string
  pl: string
  /** Phonemic IPA transcription (standard pronunciation), without slashes. */
  ipa: string
  /** Short usage note shown on the intro card. */
  note?: string
  /** Other spellings accepted when typing (e.g. feminine form). */
  alt?: string[]
}

export interface Sentence {
  it: string
  pl: string
}

export interface Grammar {
  title: string
  /** Paragraphs; a string[][] entry renders as a table. */
  body: (string | string[][])[]
}

export interface DialogueLine {
  who: string
  it: string
  pl: string
}

export interface Question {
  q: string
  options: string[]
  /** Index into options. */
  answer: number
}

export interface Dialogue {
  scene: string
  lines: DialogueLine[]
  questions: Question[]
}

export interface Lesson {
  id: string
  title: string
  goal: string
  skills: Skill[]
  items: Item[]
  grammar: Grammar
  /** Sentences built only from words known by the end of this lesson. */
  sentences: Sentence[]
  dialogue: Dialogue
}

export interface Unit {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}
