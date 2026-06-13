import { useState, useEffect, useRef, useCallback } from 'react'
import '../components/preview/WorksheetPreview.css'
import './LandingPage.css'

// ── Timing constants ───────────────────────────────────────────────────────
const TYPING_SPEED = 26  // ms per character
const RESULT_DELAY = 450 // ms after typing before result appears
const RESULT_HOLD  = 4500 // ms to show result before advancing

// ── Demo definitions ───────────────────────────────────────────────────────
const DEMOS = [
  { prompt: 'Question: students complete a density table and plot a bar chart of their results', label: 'Exam-style question', color: '#4338ca' },
  { prompt: 'Match them up: the function of different organelles in an animal cell',            label: 'Match them up',      color: '#047857' },
  { prompt: 'Cloze passage: the effect of temperature on gas pressure — 6 key words',          label: 'Cloze passage',      color: '#b45309' },
]

// ── Block previews (use exact pr- classes from WorksheetPreview.css) ───────

function DensityDemo() {
  const rows: [string, string, string][] = [
    ['Iron', '158', '20'],
    ['Copper', '178', '20'],
    ['Aluminium', '54', '20'],
    ['Lead', '226', '20'],
  ]
  const ML = 44, MR = 12, MT = 10, MB = 38
  const W = 340, H = 150
  const plotW = W - ML - MR
  const plotH = H - MT - MB
  const barW = Math.min(38, (plotW / rows.length) * 0.58)
  const yMax = 13

  return (
    <div className="demo-preview-content">
      <div className="pr-question">
        <div className="pr-question-stem">
          <span className="pr-q-num">1.</span>
          <span className="pr-q-text">
            A student investigates the density of different metals.
            Complete the results table and use your values to plot a bar chart.
          </span>
          <span className="pr-marks">[6 marks]</span>
        </div>
      </div>

      <div className="pr-data-table">
        <p className="pr-data-heading">Results table</p>
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-th" style={{ textAlign: 'left' }}>Metal</th>
              <th className="pr-th">Mass (g)</th>
              <th className="pr-th">Volume (cm³)</th>
              <th className="pr-th">Density (g/cm³)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([metal, mass, vol]) => (
              <tr key={metal}>
                <td className="pr-td" style={{ textAlign: 'left' }}>{metal}</td>
                <td className="pr-td">{mass}</td>
                <td className="pr-td">{vol}</td>
                <td className="pr-td">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pr-data-graph">
        <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
          {/* gridlines + y-labels */}
          {[0, 2, 4, 6, 8, 10, 12].map(v => {
            const y = MT + plotH - (v / yMax) * plotH
            return (
              <g key={v}>
                <line x1={ML} y1={y} x2={ML + plotW} y2={y} stroke="#e5e7eb" strokeWidth="0.8" />
                <text x={ML - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>
              </g>
            )
          })}
          {/* axes */}
          <line x1={ML} y1={MT} x2={ML} y2={MT + plotH} stroke="#374151" strokeWidth="1.5" />
          <line x1={ML} y1={MT + plotH} x2={ML + plotW} y2={MT + plotH} stroke="#374151" strokeWidth="1.5" />
          {/* blank bar areas */}
          {rows.map(([metal], i) => {
            const cx = ML + (i + 0.5) * (plotW / rows.length)
            const x = cx - barW / 2
            return (
              <g key={metal}>
                <rect
                  x={x} y={MT} width={barW} height={plotH}
                  fill="none" stroke="#d1d5db" strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <text x={cx} y={MT + plotH + 14} textAnchor="middle" fontSize="8" fill="#9ca3af">{metal}</text>
              </g>
            )
          })}
          {/* axis labels */}
          <text x={ML + plotW / 2} y={H - 1} textAnchor="middle" fontSize="8" fill="#374151">Metal</text>
          <text
            x={9} y={MT + plotH / 2}
            textAnchor="middle" fontSize="8" fill="#374151"
            transform={`rotate(-90,9,${MT + plotH / 2})`}
          >Density (g/cm³)</text>
        </svg>
      </div>
    </div>
  )
}

function MatchDemo() {
  const terms = ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell membrane', 'Cytoplasm']
  const defs  = [
    'Controls what enters and leaves the cell',
    'Jelly-like fluid where chemical reactions occur',
    'Contains genetic information; controls the cell',
    'Where proteins are synthesised',
    'Site of aerobic respiration; releases energy',
  ]
  return (
    <div className="demo-preview-content pr-match">
      <div className="pr-question-stem">
        <span className="pr-q-num">2.</span>
        <span className="pr-q-text">Draw a line to match each cell structure to its function.</span>
        <span className="pr-marks">[4 marks]</span>
      </div>
      <div className="pr-match-table">
        <div className="pr-match-col">
          {terms.map(t => (
            <div key={t} className="pr-match-cell pr-match-cell--left">{t}</div>
          ))}
        </div>
        <div className="pr-match-gap" />
        <div className="pr-match-col">
          {defs.map(d => (
            <div key={d} className="pr-match-cell pr-match-cell--right">{d}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClozeDemo() {
  const words = ['increases', 'kinetic energy', 'faster', 'frequently', 'force', 'pressure']
  return (
    <div className="demo-preview-content pr-cloze">
      <div className="pr-question-stem">
        <span className="pr-q-num">3.</span>
        <span className="pr-q-text">Complete the passage using the words in the box.</span>
        <span className="pr-marks">[6 marks]</span>
      </div>
      <div className="pr-word-bank">
        {words.map(w => <span key={w} className="pr-word-bank-word">{w}</span>)}
      </div>
      <p className="pr-cloze-text">
        When the temperature of a gas{' '}
        <span className="pr-cloze-blank" style={{ width: '6em' }} />
        {', '}the particles gain more{' '}
        <span className="pr-cloze-blank" style={{ width: '8em' }} />
        {'. '}This causes them to move{' '}
        <span className="pr-cloze-blank" style={{ width: '4em' }} />
        {' '}and collide with the container walls more{' '}
        <span className="pr-cloze-blank" style={{ width: '6.5em' }} />
        {'. '}Each collision exerts a{' '}
        <span className="pr-cloze-blank" style={{ width: '4em' }} />
        {' '}on the walls, so the{' '}
        <span className="pr-cloze-blank" style={{ width: '5em' }} />
        {' '}also increases.
      </p>
    </div>
  )
}

const DEMO_CONTENT = [<DensityDemo />, <MatchDemo />, <ClozeDemo />]

// ── Typewriter ─────────────────────────────────────────────────────────────
// No active flag — reset is handled by key-based remount of parent

function useTypewriter(text: string, speed: number) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (count >= text.length) return
    const id = setInterval(() => setCount(c => Math.min(c + 1, text.length)), speed)
    return () => clearInterval(id)
  }, [text, speed, count])

  return { typed: text.slice(0, count), done: count >= text.length }
}

// ── DemoTile — remounts on key change so state always starts fresh ──────────

function DemoTile({ demo, onComplete }: { demo: typeof DEMOS[number]; content: React.ReactNode; onComplete: () => void }) {
  const [phase, setPhase] = useState<'typing' | 'result'>('typing')
  const { typed, done } = useTypewriter(demo.prompt, TYPING_SPEED)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Typing done → wait briefly → show result
  useEffect(() => {
    if (!done || phase !== 'typing') return
    const t = setTimeout(() => setPhase('result'), RESULT_DELAY)
    return () => clearTimeout(t)
  }, [done, phase])

  // Result showing → auto-advance after hold time
  useEffect(() => {
    if (phase !== 'result') return
    const t = setTimeout(() => onCompleteRef.current(), RESULT_HOLD)
    return () => clearTimeout(t)
  }, [phase])

  const demoIdx = DEMOS.indexOf(demo)

  return (
    <div className="demo-tile">
      <div
        className="demo-prompt-area"
        style={{ '--demo-color': demo.color } as React.CSSProperties}
      >
        <div className="demo-prompt-header">
          <span className="demo-prompt-icon">✦</span>
          <span className="demo-prompt-label">{demo.label}</span>
        </div>
        <p className="demo-prompt-text">
          {typed}
          <span className={`demo-cursor${done ? ' demo-cursor--hidden' : ''}`}>|</span>
        </p>
      </div>
      <div className={`demo-result-area${phase === 'result' ? ' demo-result-area--visible' : ''}`}>
        {DEMO_CONTENT[demoIdx]}
      </div>
    </div>
  )
}

// ── Carousel ───────────────────────────────────────────────────────────────

function DemoCarousel() {
  const [slide, setSlide] = useState(0)
  const advance = useCallback(() => setSlide(s => (s + 1) % DEMOS.length), [])

  return (
    <div className="demo-carousel">
      {/* key forces clean remount on slide change — no stale animation state */}
      <DemoTile
        key={slide}
        demo={DEMOS[slide]}
        content={DEMO_CONTENT[slide]}
        onComplete={advance}
      />
      <div className="demo-dots">
        {DEMOS.map((_, i) => (
          <button
            key={i}
            className={`demo-dot${i === slide ? ' demo-dot--active' : ''}`}
            onClick={() => setSlide(i)}
            aria-label={`Demo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Landing page ───────────────────────────────────────────────────────────

export function LandingPage() {
  const [textVisible, setTextVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 20) {
        setTextVisible(true)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Fallback: reveal text after 2.8s if no scroll detected
    const fallback = setTimeout(() => setTextVisible(true), 2800)
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(fallback)
    }
  }, [])

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <video className="landing-video" autoPlay muted loop playsInline src="/intro.mp4" />
        <div className="landing-hero-overlay">
          <div className="landing-hero-content">
            <img src="/logo.svg" className="landing-hero-logo" alt="The Worksheet Project" />
            <div className={`landing-hero-text${textVisible ? ' landing-hero-text--visible' : ''}`}>
              <h1 className="landing-hero-title">
                Paper-based teaching,<br />powered by AI.
              </h1>
              <p className="landing-hero-sub">
                The AI worksheet platform that improves with every teacher who uses it.
              </p>
            </div>
          </div>
          <a className="landing-scroll-hint" href="#demo" aria-label="Scroll to demo">
            <span className="landing-scroll-label">See it in action</span>
            <div className="landing-scroll-arrow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </a>
        </div>
        {/* Gradient blending video into demo section */}
        <div className="landing-hero-fade" />
      </section>

      {/* ── Demo ── */}
      <section className="landing-demo" id="demo">
        <div className="landing-demo-head">
          <h2 className="landing-demo-title">From prompt to print in seconds</h2>
          <p className="landing-demo-sub">
            Describe what you need. Get exam-aligned questions, data tables, graphs, cloze passages, and mark schemes — ready to print.
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
