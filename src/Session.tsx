import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dialogue, Grammar } from './content/types'
import { checkAnswer, normalize } from './lib/check'
import type { Exercise } from './lib/session'
import { speak } from './lib/tts'

/** itemId → true if every answer about it in this session was right. */
export type Results = Record<string, boolean>

interface Feedback {
  ok: boolean
  /** Shown under the verdict: the right answer or a hint. */
  detail?: string
}

export function Session(props: { title: string; exercises: Exercise[]; onDone: (r: Results) => void; onQuit: () => void }) {
  const [queue, setQueue] = useState(props.exercises)
  const [pos, setPos] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const results = useRef<Results>({})
  const ex = queue[pos]

  const answer = (ok: boolean, detail?: string) => {
    if ('item' in ex && ex.kind !== 'intro') {
      results.current[ex.item.id] = (results.current[ex.item.id] ?? true) && ok
    }
    if (!ok) setQueue((q) => [...q, ex])
    setFeedback({ ok, detail })
  }

  const next = () => {
    setFeedback(null)
    if (pos + 1 >= queue.length) props.onDone(results.current)
    else setPos(pos + 1)
  }

  return (
    <div className="session">
      <header className="session-head">
        <button className="icon-btn" onClick={props.onQuit} aria-label="Zamknij">
          ✕
        </button>
        <div className="bar" aria-label="Postęp">
          <div style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
      </header>

      <main className="session-body" key={pos}>
        {ex.kind === 'intro' && <Intro ex={ex} />}
        {ex.kind === 'choose' && <Choose ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'type' && <Type ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'build' && <Build ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.kind === 'grammar' && <GrammarCard grammar={ex.grammar} />}
        {ex.kind === 'dialogue' && <DialogueView dialogue={ex.dialogue} onDone={next} />}
      </main>

      {feedback && (
        <footer className={`feedback ${feedback.ok ? 'good' : 'bad'}`}>
          <div>
            <strong>{feedback.ok ? 'Dobrze!' : 'Błąd'}</strong>
            {feedback.detail && <p>{feedback.detail}</p>}
          </div>
          <button className="btn" autoFocus onClick={next}>
            Dalej
          </button>
        </footer>
      )}
      {!feedback && (ex.kind === 'intro' || ex.kind === 'grammar') && (
        <footer className="feedback">
          <span />
          <button className="btn" onClick={next}>
            {ex.kind === 'intro' ? 'Dalej' : 'Rozumiem'}
          </button>
        </footer>
      )}
    </div>
  )
}

function Speaker({ text, big }: { text: string; big?: boolean }) {
  return (
    <span className="speaker">
      <button className={big ? 'sound big' : 'sound'} onClick={() => speak(text)} aria-label="Odtwórz">
        🔊
      </button>
      <button className="sound slow" onClick={() => speak(text, true)} aria-label="Odtwórz wolno">
        🐢
      </button>
    </span>
  )
}

function Intro({ ex }: { ex: Extract<Exercise, { kind: 'intro' }> }) {
  useEffect(() => speak(ex.item.it), [ex.item])
  return (
    <div className="card intro">
      <p className="label">Nowe</p>
      <h2 lang="it">{ex.item.it}</h2>
      <p className="pl">{ex.item.pl}</p>
      <Speaker text={ex.item.it} />
      {ex.item.note && <p className="note">{ex.item.note}</p>}
    </div>
  )
}

type AnswerFn = (ok: boolean, detail?: string) => void

function Choose({ ex, locked, onAnswer }: { ex: Extract<Exercise, { kind: 'choose' }>; locked: boolean; onAnswer: AnswerFn }) {
  const [picked, setPicked] = useState<string | null>(null)
  const { item, mode } = ex
  const right = mode === 'recall' ? item.it : item.pl
  useEffect(() => {
    if (mode !== 'recall') speak(item.it)
  }, [item, mode])

  const pick = (opt: string) => {
    if (locked) return
    setPicked(opt)
    if (mode === 'recall') speak(item.it)
    onAnswer(opt === right, `${item.it} = ${item.pl}`)
  }

  return (
    <div>
      {ex.review && <p className="label review">Powtórka</p>}
      <p className="task">
        {mode === 'read' && 'Co to znaczy?'}
        {mode === 'listen' && 'Posłuchaj. Co to znaczy?'}
        {mode === 'recall' && 'Jak to powiedzieć po włosku?'}
      </p>
      <div className="prompt">
        {mode === 'read' && (
          <>
            <h2 lang="it">{item.it}</h2>
            <Speaker text={item.it} />
          </>
        )}
        {mode === 'listen' && <Speaker text={item.it} big />}
        {mode === 'recall' && <h2>{item.pl}</h2>}
      </div>
      <div className="options">
        {ex.options.map((opt) => (
          <button
            key={opt}
            lang={mode === 'recall' ? 'it' : undefined}
            className={`option ${locked && opt === right ? 'right' : ''} ${locked && opt === picked && opt !== right ? 'wrong' : ''}`}
            onClick={() => pick(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

const ACCENTS = ['à', 'è', 'é', 'ì', 'ò', 'ù']

function Type({ ex, locked, onAnswer }: { ex: Extract<Exercise, { kind: 'type' }>; locked: boolean; onAnswer: AnswerFn }) {
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const { item } = ex

  const submit = () => {
    if (locked || !value.trim()) return
    const verdict = checkAnswer(value, [item.it, ...(item.alt ?? [])])
    speak(item.it)
    if (verdict === 'correct') onAnswer(true)
    else onAnswer(false, `${verdict === 'accents' ? 'Uwaga na akcenty. ' : ''}Poprawnie: ${item.it}`)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {ex.review && <p className="label review">Powtórka</p>}
      <p className="task">Napisz po włosku</p>
      <div className="prompt">
        <h2>{item.pl}</h2>
      </div>
      <input
        ref={input}
        className="text-input"
        lang="it"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={locked}
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        placeholder="po włosku…"
      />
      <div className="accents">
        {ACCENTS.map((a) => (
          <button
            type="button"
            key={a}
            disabled={locked}
            onClick={() => {
              setValue((v) => v + a)
              input.current?.focus()
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="btn wide" disabled={!value.trim()}>
          Sprawdź
        </button>
      )}
    </form>
  )
}

function Build({ ex, locked, onAnswer }: { ex: Extract<Exercise, { kind: 'build' }>; locked: boolean; onAnswer: AnswerFn }) {
  /** Indices into ex.tiles, in the order tapped. */
  const [chosen, setChosen] = useState<number[]>([])
  const toggle = (i: number) => {
    if (locked) return
    setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))
  }
  const check = () => {
    const given = chosen.map((i) => ex.tiles[i]).join(' ')
    const ok = normalize(given) === normalize(ex.sentence.it)
    speak(ex.sentence.it)
    onAnswer(ok, ok ? ex.sentence.it : `Poprawnie: ${ex.sentence.it}`)
  }

  return (
    <div>
      <p className="task">Ułóż zdanie po włosku</p>
      <div className="prompt">
        <h2 className="small">{ex.sentence.pl}</h2>
      </div>
      <div className="answer-line" lang="it">
        {chosen.map((i) => (
          <button key={i} className="tile" onClick={() => toggle(i)}>
            {ex.tiles[i]}
          </button>
        ))}
      </div>
      <div className="tiles" lang="it">
        {ex.tiles.map((t, i) => (
          <button key={i} className="tile" disabled={chosen.includes(i)} onClick={() => toggle(i)}>
            {t}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="btn wide" disabled={chosen.length === 0} onClick={check}>
          Sprawdź
        </button>
      )}
    </div>
  )
}

export function GrammarCard({ grammar }: { grammar: Grammar }) {
  return (
    <article className="grammar">
      <p className="label">Gramatyka</p>
      <h2>{grammar.title}</h2>
      {grammar.body.map((block, i) =>
        typeof block === 'string' ? (
          <p key={i}>{block}</p>
        ) : (
          <div className="table-wrap" key={i}>
            <table>
              <thead>
                <tr>
                  {block[0].map((c, j) => (
                    <th key={j}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.slice(1).map((row, r) => (
                  <tr key={r}>
                    {row.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </article>
  )
}

function DialogueView({ dialogue, onDone }: { dialogue: Dialogue; onDone: () => void }) {
  const [shown, setShown] = useState<Set<number>>(new Set())
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const allRight = useMemo(
    () => dialogue.questions.every((q, i) => answers[i] === q.answer),
    [answers, dialogue.questions],
  )

  return (
    <div className="dialogue">
      <p className="label">Dialog</p>
      <p className="scene">{dialogue.scene}</p>
      <p className="hint">Posłuchaj każdej kwestii. Dotknij tekstu, żeby zobaczyć tłumaczenie.</p>
      <ul>
        {dialogue.lines.map((line, i) => (
          <li key={i}>
            <button className="sound" onClick={() => speak(line.it)} aria-label="Odtwórz">
              🔊
            </button>
            <button
              className="line"
              onClick={() => setShown((s) => new Set(s).add(i))}
            >
              <span className="who">{line.who}</span>
              <span lang="it">{line.it}</span>
              {shown.has(i) && <span className="tr">{line.pl}</span>}
            </button>
          </li>
        ))}
      </ul>
      {dialogue.questions.map((q, qi) => (
        <div className="question" key={qi}>
          <p>{q.q}</p>
          <div className="options">
            {q.options.map((opt, oi) => {
              const picked = answers[qi] === oi
              return (
                <button
                  key={oi}
                  className={`option ${picked ? (oi === q.answer ? 'right' : 'wrong') : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <button className="btn wide" disabled={!allRight} onClick={onDone}>
        Zakończ
      </button>
    </div>
  )
}
