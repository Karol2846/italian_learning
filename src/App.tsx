import { useState } from 'react'
import { lessons, units } from './content'
import type { Lesson } from './content/types'
import { buildLessonSession, buildReviewSession, dueItems, type Exercise } from './lib/session'
import { isDue, review, schedule } from './lib/srs'
import { loadProgress, saveProgress, type Progress } from './lib/store'
import { GrammarCard, Session, type Results } from './Session'

type Screen =
  | { name: 'home' }
  | { name: 'session'; title: string; exercises: Exercise[]; lesson?: Lesson }
  | { name: 'done'; title: string; mistakes: number; total: number }
  | { name: 'grammar'; lesson: Lesson }

const SKILL_LABEL = { read: 'czytanie', listen: 'słuchanie', write: 'pisanie', speak: 'mówienie' }

function applyResults(p: Progress, results: Results, lesson?: Lesson): Progress {
  const cards = { ...p.cards }
  for (const [id, ok] of Object.entries(results)) {
    const card = cards[id]
    if (!card) cards[id] = schedule(ok ? 2 : 1)
    else if (isDue(card)) cards[id] = review(card, ok)
    else if (!ok) cards[id] = schedule(1)
  }
  const lessonsDone = lesson && !p.lessonsDone.includes(lesson.id) ? [...p.lessonsDone, lesson.id] : p.lessonsDone
  return { cards, lessonsDone }
}

export function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const home = () => setScreen({ name: 'home' })

  if (screen.name === 'session') {
    return (
      <Session
        title={screen.title}
        exercises={screen.exercises}
        onQuit={home}
        onDone={(results) => {
          const next = applyResults(progress, results, screen.lesson)
          setProgress(next)
          saveProgress(next)
          const all = Object.values(results)
          setScreen({ name: 'done', title: screen.title, total: all.length, mistakes: all.filter((ok) => !ok).length })
        }}
      />
    )
  }

  if (screen.name === 'done') {
    return (
      <div className="page center">
        <div className="big-emoji">🎉</div>
        <h1>Bravo!</h1>
        <p>{screen.title} — ukończone.</p>
        <p className="muted">
          {screen.mistakes === 0
            ? 'Bez ani jednego błędu.'
            : `Słówka z błędem: ${screen.mistakes} z ${screen.total}. Wrócą jutro w powtórkach.`}
        </p>
        <button className="btn wide" onClick={home}>
          Wróć do kursu
        </button>
      </div>
    )
  }

  if (screen.name === 'grammar') {
    return (
      <div className="page">
        <button className="link" onClick={home}>
          ← Kurs
        </button>
        <GrammarCard grammar={screen.lesson.grammar} />
        <h3>Słówka z tej lekcji</h3>
        <ul className="wordlist">
          {screen.lesson.items.map((i) => (
            <li key={i.id}>
              <span lang="it">{i.it}</span>
              <span className="muted">{i.pl}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const due = dueItems(progress).length
  const nextLesson = lessons.find((l) => !progress.lessonsDone.includes(l.id))

  return (
    <div className="page">
      <header className="top">
        <h1>Italiano</h1>
        <p className="muted">
          {Object.keys(progress.cards).length} słówek · {progress.lessonsDone.length}/{lessons.length} lekcji
        </p>
      </header>

      <button
        className="review-card"
        disabled={due === 0}
        onClick={() => setScreen({ name: 'session', title: 'Powtórki', exercises: buildReviewSession(progress) })}
      >
        <strong>Powtórki</strong>
        <span>{due === 0 ? 'Na dziś wszystko powtórzone' : `${due} do powtórzenia`}</span>
      </button>

      {units.map((unit, ui) => (
        <section key={unit.id} className="unit">
          <h2>
            <span className="num">{ui + 1}</span> {unit.title}
          </h2>
          <p className="muted">{unit.description}</p>
          <ol className="lessons">
            {unit.lessons.map((lesson) => {
              const done = progress.lessonsDone.includes(lesson.id)
              const open = done || lesson.id === nextLesson?.id
              return (
                <li key={lesson.id} className={done ? 'done' : open ? 'open' : 'locked'}>
                  <button
                    className="lesson"
                    disabled={!open}
                    onClick={() =>
                      setScreen({
                        name: 'session',
                        title: lesson.title,
                        lesson,
                        exercises: buildLessonSession(lesson, progress),
                      })
                    }
                  >
                    <span className="status">{done ? '✓' : open ? '▶' : '🔒'}</span>
                    <span className="info">
                      <strong>{lesson.title}</strong>
                      <span>{lesson.goal}</span>
                      <span className="skills">{lesson.skills.map((s) => SKILL_LABEL[s]).join(' · ')}</span>
                    </span>
                  </button>
                  {done && (
                    <button className="link" onClick={() => setScreen({ name: 'grammar', lesson })}>
                      Gramatyka i słówka
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}

      <p className="muted footer-note">Kolejne moduły w drodze: w barze, ludzie, w mieście, restauracja…</p>
    </div>
  )
}
