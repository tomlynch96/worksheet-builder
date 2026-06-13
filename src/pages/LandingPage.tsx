import { useState, useEffect, useRef, useCallback } from 'react'
import '../components/preview/WorksheetPreview.css'
import './LandingPage.css'

// ── Timing constants ───────────────────────────────────────────────────────
const TYPING_SPEED = 26
const RESULT_DELAY = 450
const RESULT_HOLD  = 4500

// ── Demo definitions ───────────────────────────────────────────────────────
const DEMOS = [
  { prompt: 'Question: students complete a density table and plot a bar chart of their results', label: 'Exam-style question', color: '#4338ca' },
  { prompt: 'Match them up: the function of different organelles in an animal cell',            label: 'Match them up',      color: '#047857' },
  { prompt: 'Cloze passage: the effect of temperature on gas pressure — 6 key words',          label: 'Cloze passage',      color: '#b45309' },
]

// ── Block previews — exact pr- classes, matching actual worksheet preview ──

function DensityDemo() {
  const rows: [string, string, string][] = [
    ['Iron', '158', '20'],
    ['Copper', '178', '20'],
    ['Aluminium', '54', '20'],
    ['Lead', '226', '20'],
  ]
  // Match PreviewDataBar constants exactly
  const BAR_W = 440, BAR_H = 280
  const BAR_ML = 48, BAR_MR = 16, BAR_MT = 16, BAR_MB = 48
  const BAR_PW = BAR_W - BAR_ML - BAR_MR
  const BAR_PH = BAR_H - BAR_MT - BAR_MB
  const yMax = 12
  const yTicks = [0, 2, 4, 6, 8, 10, 12]
  const total = rows.length
  const gap = BAR_PW / total
  function barY(v: number) { return BAR_MT + BAR_PH - (v / yMax) * BAR_PH }

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

      {/* Bar chart — matches PreviewDataBar with no bars (student plots these) */}
      <div className="pr-data-graph">
        <svg width={BAR_W} height={BAR_H} className="pr-graph-svg" style={{ maxWidth: '100%' }}>
          {/* Minor gridlines */}
          {[1,3,5,7,9,11].map(v => (
            <line key={v} x1={BAR_ML} y1={barY(v)} x2={BAR_ML + BAR_PW} y2={barY(v)} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* Major gridlines + y labels */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={BAR_ML} y1={barY(v)} x2={BAR_ML + BAR_PW} y2={barY(v)} stroke="#d1d5db" strokeWidth="1" />
              <text x={BAR_ML - 4} y={barY(v) + 3} textAnchor="end" fontSize="9" fill="#374151">{v}</text>
            </g>
          ))}
          {/* Axes */}
          <line x1={BAR_ML} y1={BAR_MT} x2={BAR_ML} y2={BAR_MT + BAR_PH} stroke="#374151" strokeWidth="1.5" />
          <line x1={BAR_ML} y1={BAR_MT + BAR_PH} x2={BAR_ML + BAR_PW} y2={BAR_MT + BAR_PH} stroke="#374151" strokeWidth="1.5" />
          {/* X labels only — no bars */}
          {rows.map(([metal], i) => {
            const cx = BAR_ML + gap * i + gap / 2
            return (
              <text key={metal} x={cx} y={BAR_MT + BAR_PH + 14} textAnchor="middle" fontSize="9" fill="#374151">{metal}</text>
            )
          })}
          {/* Axis labels */}
          <text x={BAR_ML + BAR_PW / 2} y={BAR_H - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937">Metal</text>
          <text x={10} y={BAR_MT + BAR_PH / 2} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937" transform={`rotate(-90, 10, ${BAR_MT + BAR_PH / 2})`}>Density (g/cm³)</text>
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

function useTypewriter(text: string, speed: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (count >= text.length) return
    const id = setInterval(() => setCount(c => Math.min(c + 1, text.length)), speed)
    return () => clearInterval(id)
  }, [text, speed, count])
  return { typed: text.slice(0, count), done: count >= text.length }
}

// ── DemoTile — key-based remount keeps state clean per slide ──────────────

function DemoTile({ demo, onComplete }: { demo: typeof DEMOS[number]; onComplete: () => void }) {
  const [phase, setPhase] = useState<'typing' | 'result'>('typing')
  const { typed, done } = useTypewriter(demo.prompt, TYPING_SPEED)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!done || phase !== 'typing') return
    const t = setTimeout(() => setPhase('result'), RESULT_DELAY)
    return () => clearTimeout(t)
  }, [done, phase])

  useEffect(() => {
    if (phase !== 'result') return
    const t = setTimeout(() => onCompleteRef.current(), RESULT_HOLD)
    return () => clearTimeout(t)
  }, [phase])

  const idx = DEMOS.indexOf(demo)

  return (
    <div className="demo-tile">
      <div className="demo-prompt-area" style={{ '--demo-color': demo.color } as React.CSSProperties}>
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
        {DEMO_CONTENT[idx]}
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
      <DemoTile key={slide} demo={DEMOS[slide]} onComplete={advance} />
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
  return (
    <div className="landing">

      {/* ── Hero: full-viewport video only ── */}
      <section className="landing-hero">
        <video className="landing-video" autoPlay muted loop playsInline src="/intro.mp4" />
        {/* Gradient blends video into white below */}
        <div className="landing-hero-fade" />
        {/* Scroll hint sits in the fade zone — dark text against the whitening gradient */}
        <a className="landing-scroll-hint" href="#tagline" aria-label="Scroll down">
          <span className="landing-scroll-label">See it in action</span>
          <div className="landing-scroll-arrow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </a>
      </section>

      {/* ── Tagline: headline + sub on white ── */}
      <section className="landing-tagline-section" id="tagline">
        <h1 className="landing-tagline-title">
          Paper-based teaching,<br />powered by AI.
        </h1>
        <p className="landing-tagline-sub">
          The AI worksheet platform that improves with every teacher who uses it.
        </p>
      </section>

      {/* ── Demo carousel ── */}
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
