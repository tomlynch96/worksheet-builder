import { useState, useEffect, useRef } from 'react'
import './LandingPage.css'

// ── Demo tile definitions ──────────────────────────────────────────────────

const DEMOS = [
  {
    prompt: 'Question: students complete a density table and plot a bar chart of their results',
    label: 'Exam-style question',
    color: '#4338ca',
    content: <DensityQuestion />,
  },
  {
    prompt: 'Match them up: the function of different organelles in an animal cell',
    label: 'Match them up',
    color: '#047857',
    content: <MatchThemUp />,
  },
  {
    prompt: 'Cloze passage: the effect of temperature on gas pressure — use 6 key words',
    label: 'Cloze passage',
    color: '#b45309',
    content: <ClozePassage />,
  },
]

const TYPING_SPEED = 28 // ms per character
const RESULT_HOLD = 3800 // ms to show result before advancing
const RESULT_DELAY = 500 // ms pause after typing before result appears

// ── Sub-components: block previews ────────────────────────────────────────

function DensityQuestion() {
  const rows = [
    { metal: 'Iron', mass: '158', volume: '20', density: '' },
    { metal: 'Copper', mass: '178', volume: '20', density: '' },
    { metal: 'Aluminium', mass: '54', volume: '20', density: '' },
    { metal: 'Lead', mass: '226', volume: '20', density: '' },
  ]
  return (
    <div className="demo-block">
      <div className="demo-block-tag">Question · 6 marks</div>
      <p className="demo-block-text">
        A student investigates the density of different metals. Complete the table below and plot a bar chart of the densities on the axes provided. <span className="demo-mark">[6]</span>
      </p>
      <table className="demo-table">
        <thead>
          <tr>
            <th>Metal</th>
            <th>Mass (g)</th>
            <th>Volume (cm³)</th>
            <th>Density (g/cm³)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.metal}>
              <td>{r.metal}</td>
              <td>{r.mass}</td>
              <td>{r.volume}</td>
              <td><span className="demo-blank" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="demo-chart">
        <div className="demo-chart-yaxis">
          {[12, 10, 8, 6, 4, 2, 0].map(v => (
            <div key={v} className="demo-chart-ytick">
              <span>{v}</span>
              <div className="demo-chart-gridline" />
            </div>
          ))}
        </div>
        <div className="demo-chart-bars">
          {rows.map(r => (
            <div key={r.metal} className="demo-chart-col">
              <div className="demo-chart-bar-area" />
              <span className="demo-chart-xlabel">{r.metal}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="demo-chart-label">Density (g/cm³)</p>
    </div>
  )
}

function MatchThemUp() {
  const pairs = [
    { term: 'Nucleus', def: 'Contains genetic information and controls the cell' },
    { term: 'Mitochondria', def: 'Site of aerobic respiration; releases energy' },
    { term: 'Ribosome', def: 'Where proteins are synthesised' },
    { term: 'Cell membrane', def: 'Controls what enters and leaves the cell' },
    { term: 'Cytoplasm', def: 'Jelly-like fluid where chemical reactions occur' },
  ]
  const shuffledDefs = ['Controls what enters and leaves the cell', 'Jelly-like fluid where chemical reactions occur', 'Contains genetic information and controls the cell', 'Where proteins are synthesised', 'Site of aerobic respiration; releases energy']
  return (
    <div className="demo-block">
      <div className="demo-block-tag">Match them up</div>
      <p className="demo-block-text">Draw a line to match each structure to its function.</p>
      <div className="demo-match">
        <div className="demo-match-col">
          {pairs.map(p => (
            <div key={p.term} className="demo-match-term">{p.term}</div>
          ))}
        </div>
        <div className="demo-match-lines" aria-hidden>
          <svg viewBox="0 0 60 200" preserveAspectRatio="none">
            {[0,1,2,3,4].map(i => (
              <line key={i} x1="0" y1={20 + i * 36} x2="60" y2={20 + [2,4,0,3,1][i] * 36} stroke="#d1d5db" strokeWidth="1.5" />
            ))}
          </svg>
        </div>
        <div className="demo-match-col demo-match-col--right">
          {shuffledDefs.map(d => (
            <div key={d} className="demo-match-def">{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClozePassage() {
  const words = ['increases', 'kinetic energy', 'faster', 'frequently', 'force', 'pressure']
  return (
    <div className="demo-block">
      <div className="demo-block-tag">Cloze passage</div>
      <p className="demo-block-text demo-cloze-text">
        When the temperature of a gas{' '}
        <span className="demo-cloze-blank">__________</span>
        {', '}the particles gain more{' '}
        <span className="demo-cloze-blank">__________</span>
        {'. '}This causes them to move{' '}
        <span className="demo-cloze-blank">__________</span>
        {' '}and collide with the container walls more{' '}
        <span className="demo-cloze-blank">__________</span>
        {'. '}Each collision exerts a{' '}
        <span className="demo-cloze-blank">__________</span>
        {' '}on the walls, so the{' '}
        <span className="demo-cloze-blank">__________</span>
        {' '}increases.
      </p>
      <div className="demo-wordbank">
        <span className="demo-wordbank-label">Word bank:</span>
        {words.map(w => (
          <span key={w} className="demo-wordbank-word">{w}</span>
        ))}
      </div>
    </div>
  )
}

// ── Typewriter hook ────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number, active: boolean) {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setCount(0)
  }, [text])

  useEffect(() => {
    if (!active) { setCount(0); return }
    if (count >= text.length) return
    intervalRef.current = setInterval(() => {
      setCount(c => {
        if (c >= text.length) {
          clearInterval(intervalRef.current!)
          return c
        }
        return c + 1
      })
    }, speed)
    return () => clearInterval(intervalRef.current!)
  }, [active, text, speed, count])

  return { typed: text.slice(0, count), done: count >= text.length }
}

// ── Carousel ──────────────────────────────────────────────────────────────

function DemoCarousel() {
  const [slide, setSlide] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'result'>('typing')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const demo = DEMOS[slide]
  const { typed, done } = useTypewriter(demo.prompt, TYPING_SPEED, phase === 'typing')

  // When typing finishes → wait then show result
  useEffect(() => {
    if (!done || phase !== 'typing') return
    timerRef.current = setTimeout(() => setPhase('result'), RESULT_DELAY)
    return () => clearTimeout(timerRef.current!)
  }, [done, phase])

  // When result shown → auto-advance
  useEffect(() => {
    if (phase !== 'result') return
    timerRef.current = setTimeout(() => {
      setSlide(s => (s + 1) % DEMOS.length)
      setPhase('typing')
    }, RESULT_HOLD)
    return () => clearTimeout(timerRef.current!)
  }, [phase])

  function goTo(i: number) {
    clearTimeout(timerRef.current!)
    setSlide(i)
    setPhase('typing')
  }

  return (
    <div className="demo-carousel">
      <div className="demo-tile">
        {/* Prompt area */}
        <div className="demo-prompt-area" style={{ '--demo-color': demo.color } as React.CSSProperties}>
          <span className="demo-prompt-icon">✦</span>
          <span className="demo-prompt-label">{demo.label}</span>
          <p className="demo-prompt-text">
            {typed}
            <span className={`demo-cursor${done ? ' demo-cursor--hidden' : ''}`}>|</span>
          </p>
        </div>

        {/* Result area */}
        <div className={`demo-result-area${phase === 'result' ? ' demo-result-area--visible' : ''}`}>
          {demo.content}
        </div>
      </div>

      {/* Nav dots */}
      <div className="demo-dots">
        {DEMOS.map((_, i) => (
          <button
            key={i}
            className={`demo-dot${i === slide ? ' demo-dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Demo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <video className="landing-video" autoPlay muted loop playsInline src="/intro.mp4" />
        <div className="landing-hero-overlay">
          <div className="landing-hero-content">
            <img src="/logo.svg" className="landing-hero-logo" alt="The Worksheet Project" />
            <h1 className="landing-hero-title">
              Paper-based teaching,<br />powered by AI.
            </h1>
            <p className="landing-hero-sub">
              The AI worksheet platform that improves with every teacher who uses it.
            </p>
          </div>
          <a className="landing-scroll-hint" href="#demo" aria-label="Scroll to see demo">
            <span className="landing-scroll-label">See it in action</span>
            <div className="landing-scroll-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>
        </div>
      </section>

      {/* ── Demo section ── */}
      <section className="landing-demo" id="demo">
        <div className="landing-demo-head">
          <h2 className="landing-demo-title">From prompt to print in seconds</h2>
          <p className="landing-demo-sub">
            Describe what you need. Get curriculum-aligned questions, tables, graphs, cloze passages, and mark schemes — ready to print.
          </p>
        </div>

        <DemoCarousel />

        <div className="landing-cta-wrap">
          <a className="landing-cta" href="/onboarding">
            Get started — free preview trial
          </a>
          <p className="landing-cta-note">No credit card required · Science teachers only for now</p>
        </div>
      </section>
    </div>
  )
}
