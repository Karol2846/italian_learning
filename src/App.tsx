import { useState } from 'react'
import { lessons, units } from './content'
import type { Lesson } from './content/types'
import { buildLessonSession, buildReviewSession, dueItems } from './lib/session'
import { isDue, review, schedule } from './lib/srs'
import { loadProgress, loadSession, loadSettings, saveProgress, saveSession, saveSettings, type Progress, type SavedSession } from './lib/store'
import { GrammarCard, Session, type Results } from './Session'

type Screen =
  | { name: 'home' }
  | { name: 'start'; lesson: Lesson }
  | { name: 'session' }
  | { name: 'done'; title: string; mistakes: number; total: number; nextPart?: { lesson: Lesson; part: number; parts: number } }
  | { name: 'words'; lesson: Lesson }

const SKILL_LABEL = { read: 'czytanie', listen: 'słuchanie', write: 'pisanie', speak: 'mówienie' }
const lessonById = (id?: string) => lessons.find((l) => l.id === id)

/** Updates review cards and lesson/part completion after a finished session. */
function applyResults(p: Progress, results: Results, s: SavedSession): Progress {
  const cards = { ...p.cards }
  for (const [id, ok] of Object.entries(results)) {
    const card = cards[id]
    if (!card) cards[id] = schedule(ok ? 2 : 1)
    else if (isDue(card)) cards[id] = review(card, ok)
    else if (!ok) cards[id] = schedule(1)
  }
  if (!s.lessonId) return { ...p, cards }

  const partial = { ...p.partial }
  let lessonsDone = p.lessonsDone
  if (s.part < s.parts - 1) {
    partial[s.lessonId] = { parts: s.parts, done: s.part + 1 }
  } else {
    delete partial[s.lessonId]
    if (!lessonsDone.includes(s.lessonId)) lessonsDone = [...lessonsDone, s.lessonId]
  }
  return { cards, lessonsDone, partial }
}

export function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [saved, setSaved] = useState(loadSession)
  const [settings, setSettings] = useState(loadSettings)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [tab, setTab] = useState<'course' | 'grammar'>('course')
  const home = () => setScreen({ name: 'home' })

  const begin = (s: SavedSession) => {
    saveSession(s)
    setSaved(s)
    setScreen({ name: 'session' })
  }
  const beginLesson = (lesson: Lesson, part: number, parts: number) =>
    begin({
      title: lesson.title,
      lessonId: lesson.id,
      part,
      parts,
      queue: buildLessonSession(lesson, progress, part, parts),
      pos: 0,
      results: {},
    })
  const openLesson = (lesson: Lesson) => {
    const part = progress.partial[lesson.id]
    if (saved?.lessonId === lesson.id) setScreen({ name: 'session' })
    else if (part) beginLesson(lesson, part.done, part.parts)
    else setScreen({ name: 'start', lesson })
  }

  if (screen.name === 'session' && saved) {
    return (
      <Session
        saved={saved}
        showIpa={settings.ipa}
        onStep={(s) => {
          saveSession(s)
          setSaved(s)
        }}
        onQuit={home}
        onDone={(results) => {
          const next = applyResults(progress, results, saved)
          setProgress(next)
          saveProgress(next)
          saveSession(null)
          setSaved(null)
          const all = Object.values(results)
          const lesson = lessonById(saved.lessonId)
          setScreen({
            name: 'done',
            title: saved.parts > 1 ? `${saved.title}, część ${saved.part + 1} z ${saved.parts}` : saved.title,
            total: all.length,
            mistakes: all.filter((ok) => !ok).length,
            nextPart:
              lesson && saved.part < saved.parts - 1 ? { lesson, part: saved.part + 1, parts: saved.parts } : undefined,
          })
        }}
      />
    )
  }

  if (screen.name === 'start') return <Start lesson={screen.lesson} onBack={home} onStart={(n) => beginLesson(screen.lesson, 0, n)} />

  if (screen.name === 'done') {
    const { nextPart } = screen
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
        {nextPart && (
          <button className="btn wide" onClick={() => beginLesson(nextPart.lesson, nextPart.part, nextPart.parts)}>
            Następna część
          </button>
        )}
        <button className={nextPart ? 'link' : 'btn wide'} onClick={home}>
          {nextPart ? 'Na dziś wystarczy' : 'Wróć do kursu'}
        </button>
      </div>
    )
  }

  if (screen.name === 'words') {
    return (
      <div className="page">
        <button className="link" onClick={home}>
          ← Kurs
        </button>
        <h1>{screen.lesson.title}</h1>
        <ul className="wordlist">
          {screen.lesson.items.map((i) => (
            <li key={i.id}>
              <span>
                <span lang="it">{i.it}</span>
                {settings.ipa && <span className="ipa"> /{i.ipa}/</span>}
              </span>
              <span className="muted">{i.pl}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const due = dueItems(progress).length
  const nextLesson = lessons.find((l) => !progress.lessonsDone.includes(l.id))
  const learned = lessons.filter((l) => progress.lessonsDone.includes(l.id))

  return (
    <div className="page with-tabs">
      {tab === 'course' && (
        <>
          <header className="top">
            <h1>Italiano</h1>
            <p className="muted">
              {Object.keys(progress.cards).length} słówek · {progress.lessonsDone.length}/{lessons.length} lekcji
            </p>
          </header>

          {saved && (
            <button className="resume-card" onClick={() => setScreen({ name: 'session' })}>
              <div>
                <strong>Kontynuuj: {saved.title}</strong>
                <br />
                <span>
                  {saved.parts > 1 && `część ${saved.part + 1} z ${saved.parts} · `}
                  zostało {saved.queue.length - saved.pos} ćwiczeń
                </span>
              </div>
              <span className="go">▶</span>
            </button>
          )}

          <button
            className="review-card"
            disabled={due === 0}
            onClick={() =>
              begin({ title: 'Powtórki', part: 0, parts: 1, queue: buildReviewSession(progress), pos: 0, results: {} })
            }
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
                  const part = progress.partial[lesson.id]
                  return (
                    <li key={lesson.id} className={done ? 'done' : open ? 'open' : 'locked'}>
                      <button className="lesson" disabled={!open} onClick={() => openLesson(lesson)}>
                        <span className="status">{done ? '✓' : open ? '▶' : '🔒'}</span>
                        <span className="info">
                          <strong>{lesson.title}</strong>
                          <span>{lesson.goal}</span>
                          <span className="skills">
                            {part
                              ? `ukończono ${part.done} z ${part.parts} części`
                              : lesson.skills.map((s) => SKILL_LABEL[s]).join(' · ')}
                          </span>
                        </span>
                      </button>
                      {done && (
                        <button className="link" onClick={() => setScreen({ name: 'words', lesson })}>
                          Słówka
                        </button>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}

          <p className="muted footer-note">Kolejne moduły w drodze: w barze, ludzie, w mieście, restauracja…</p>
        </>
      )}

      {tab === 'grammar' && (
        <>
          <header className="top">
            <h1>Gramatyka</h1>
            <p className="muted">Wszystko, co było już w lekcjach. Nowe tematy dochodzą z każdą kolejną.</p>
          </header>
          <label className="setting">
            <input
              type="checkbox"
              checked={settings.ipa}
              onChange={(e) => {
                const next = { ...settings, ipa: e.target.checked }
                setSettings(next)
                saveSettings(next)
              }}
            />
            <span>
              Zapis fonetyczny (IPA) przy słówkach
              <small>Pokazuje wymowę przy nowych słówkach, w czytaniu i na listach słówek.</small>
            </span>
          </label>
          {learned.length === 0 && <p className="muted">Ukończ pierwszą lekcję, a jej gramatyka pojawi się tutaj.</p>}
          <ul className="topics">
            {learned.map((lesson) => (
              <li key={lesson.id}>
                <details>
                  <summary>
                    {lesson.grammar.title}
                    <span>Lekcja: {lesson.title}</span>
                  </summary>
                  <GrammarCard grammar={lesson.grammar} />
                </details>
              </li>
            ))}
          </ul>
        </>
      )}

      <nav className="tabs">
        <button className={tab === 'course' ? 'active' : ''} onClick={() => setTab('course')}>
          Kurs
        </button>
        <button className={tab === 'grammar' ? 'active' : ''} onClick={() => setTab('grammar')}>
          Gramatyka
        </button>
      </nav>
    </div>
  )
}

function Start({ lesson, onBack, onStart }: { lesson: Lesson; onBack: () => void; onStart: (parts: number) => void }) {
  const [parts, setParts] = useState(1)
  const n = lesson.items.length
  const choices = [
    { parts: 1, label: 'Cała lekcja na raz', hint: `${n} słówek, gramatyka i dialog` },
    { parts: 2, label: 'W 2 częściach', hint: `po ok. ${Math.ceil(n / 2)} słówek` },
    { parts: 3, label: 'W 3 częściach', hint: `po ok. ${Math.ceil(n / 3)} słówka` },
  ]
  return (
    <div className="page start-page">
      <button className="link" onClick={onBack}>
        ← Kurs
      </button>
      <h1>{lesson.title}</h1>
      <p className="muted">{lesson.goal}</p>
      <h3>Jak chcesz ją przerobić?</h3>
      <div className="parts">
        {choices.map((c) => (
          <button key={c.parts} className={`option ${parts === c.parts ? 'active' : ''}`} onClick={() => setParts(c.parts)}>
            {c.label}
            <span>{c.hint}</span>
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        Gramatyka, układanie zdań i dialog są zawsze w ostatniej części.
      </p>
      <button className="btn wide" onClick={() => onStart(parts)}>
        Zaczynamy
      </button>
    </div>
  )
}
