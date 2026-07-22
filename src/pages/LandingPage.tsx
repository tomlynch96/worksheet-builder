import { useEffect, useRef, useState } from 'react'
import '../components/layout/Topbar.css'
import './LandingPage.css'

// ── Example worksheet preview (Animal Cells, pre-seeded from Oak National Academy) ──
const WORKSHEET_PAGE_COUNT = 9
const WORKSHEET_PDF_URL = '/example-worksheet/animal-cells.pdf'
const pageImageUrl = (n: number) => `/example-worksheet/page-${n}.png`

function PdfClickThrough() {
  const [page, setPage] = useState(1)
  const go = (delta: number) => setPage(p => Math.min(WORKSHEET_PAGE_COUNT, Math.max(1, p + delta)))

  return (
    <div className="pdf-preview">
      <a
        className="pdf-preview-frame"
        href={WORKSHEET_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the full Animal Cells worksheet PDF in a new tab"
      >
        <img
          src={pageImageUrl(page)}
          alt={`Animal Cells worksheet — page ${page} of ${WORKSHEET_PAGE_COUNT}`}
          className="pdf-preview-img"
        />
        <span className="pdf-preview-expand">Open full PDF ↗</span>
      </a>

      <div className="pdf-preview-controls">
        <button
          type="button"
          className="pdf-preview-arrow"
          onClick={() => go(-1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="pdf-preview-count">Page {page} of {WORKSHEET_PAGE_COUNT}</span>
        <button
          type="button"
          className="pdf-preview-arrow"
          onClick={() => go(1)}
          disabled={page === WORKSHEET_PAGE_COUNT}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <p className="pdf-preview-credit">
        Objectives, questions, misconceptions and images seeded from Oak National Academy lesson resources.
      </p>
    </div>
  )
}

// ── Philosophy bullets ──────────────────────────────────────────────────────

const PHILOSOPHY_POINTS = [
  {
    title: 'Starts super-easy',
    body: "Most independent practice fails because the class never really settles. Real, silent focus takes a few minutes to build, and any uncertainty about how to start ruins it — so early questions (often a quick recap of key facts) need to be unmissable.",
  },
  {
    title: 'Repeats the same idea, slightly differently',
    body: "As experts we badly underestimate how much repetition it takes to build fluency. The goal isn't 'until they get it right' — it's 'until they can't get it wrong'.",
  },
  {
    title: 'Builds in complexity',
    body: "By the end, the same core idea is applied in far harder contexts. Not every pupil gets there — that's fine. It's the only part of the lesson where pupils genuinely work at their own pace.",
  },
  {
    title: 'Keeps scientific skills embedded',
    body: "AI makes short knowledge questions trivial to generate. That can't come at the expense of graphs and diagrams — the real risk when teachers build their own resources from scratch.",
  },
]

function PhilosophySummary() {
  return (
    <div className="philosophy">
      <h2 className="philosophy-title">Why these worksheets look the way they do</h2>
      <p className="philosophy-intro">
        What does a good worksheet look like? This didn't use to exist, but with AI — now it can.
      </p>

      <ul className="philosophy-list">
        {PHILOSOPHY_POINTS.map(point => (
          <li key={point.title} className="philosophy-item">
            <span className="philosophy-item-title">{point.title}</span>
            <span className="philosophy-item-body">{point.body}</span>
          </li>
        ))}
      </ul>

      <p className="philosophy-note">
        Reasonable pushback: "sounds great, but where does the lesson time come from?" I'm still
        working through that properly — more on it soon.
      </p>

      <a className="landing-cta" href="/onboarding">Try it now</a>
      <p className="landing-cta-note">Help shape what this project becomes</p>
    </div>
  )
}

// ── Worksheet → Bubble sheet illustration ───────────────────────────────────

function WorksheetToBubbleSheet() {
  const worksheetLines = [0.9, 0.65, 0.8, 0.4]
  const bubbleRows = 5
  const bubbleCols = 4 // A, B, C, D
  const answerKey = [1, 3, 0, 2, 1] // filled column index per row

  return (
    <svg viewBox="0 0 640 260" className="mcq-svg" role="img" aria-labelledby="mcqSvgTitle">
      <title id="mcqSvgTitle">A worksheet transforming into a bubble-sheet multiple choice test</title>

      {/* Worksheet card */}
      <g transform="translate(20, 20)">
        <rect width="180" height="220" rx="10" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
        <rect x="16" y="16" width="148" height="10" rx="3" fill="#111827" />
        <rect x="16" y="34" width="90" height="7" rx="3" fill="#9ca3af" />

        {worksheetLines.map((w, i) => (
          <rect key={i} x="16" y={58 + i * 16} width={148 * w} height="6" rx="3" fill="#d1d5db" />
        ))}

        {/* tiny graph, nodding to the graph-skills emphasis */}
        <g transform="translate(16, 138)">
          <line x1="0" y1="60" x2="0" y2="0" stroke="#9ca3af" strokeWidth="2" />
          <line x1="0" y1="60" x2="110" y2="60" stroke="#9ca3af" strokeWidth="2" />
          <polyline points="10,50 35,30 60,38 85,12 105,20" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Arrow */}
      <g transform="translate(228, 118)">
        <line x1="0" y1="12" x2="164" y2="12" stroke="#c7d2fe" strokeWidth="3" strokeDasharray="7 7" />
        <path d="M156 2 L172 12 L156 22 Z" fill="#4f46e5" />
        <text x="82" y="-10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4f46e5" letterSpacing="0.04em">
          AUTO-GENERATED
        </text>
      </g>

      {/* Bubble sheet card */}
      <g transform="translate(440, 20)">
        <rect width="180" height="220" rx="10" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
        <rect x="16" y="16" width="110" height="10" rx="3" fill="#111827" />
        <rect x="16" y="34" width="70" height="7" rx="3" fill="#9ca3af" />

        {/* barcode-style ID strip */}
        {[...Array(14)].map((_, i) => (
          <rect key={i} x={140 + i * 2.4} y="14" width="1.3" height="22" fill="#d1d5db" />
        ))}

        {/* column headers A B C D */}
        {['A', 'B', 'C', 'D'].map((label, c) => (
          <text
            key={label}
            x={100 + c * 20}
            y="56"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#6b7280"
          >
            {label}
          </text>
        ))}

        {[...Array(bubbleRows)].map((_, r) => (
          <g key={r}>
            <text x="16" y={72 + r * 26} fontSize="9" fill="#6b7280">{r + 1}</text>
            {[...Array(bubbleCols)].map((_, c) => {
              const filled = answerKey[r] === c
              return (
                <circle
                  key={c}
                  cx={100 + c * 20}
                  cy={68 + r * 26}
                  r="6.5"
                  fill={filled ? '#4f46e5' : '#fff'}
                  stroke={filled ? '#4f46e5' : '#d1d5db'}
                  strokeWidth="1.6"
                />
              )
            })}
          </g>
        ))}
      </g>
    </svg>
  )
}

// ── Prompt → worksheet → bubble sheet flow (animates once, then stays static) ──

function PromptPanel() {
  return (
    <svg viewBox="0 0 200 190" className="flow-svg" role="img" aria-label="A teacher typing a prompt describing the worksheet they need">
      <rect x="4" y="4" width="192" height="182" rx="12" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <circle className="flow-fade" cx="28" cy="30" r="10" fill="#4f46e5" style={{ animationDelay: '0.1s' }} />
      <text className="flow-fade" x="28" y="34" textAnchor="middle" fontSize="12" fill="#fff" style={{ animationDelay: '0.1s' }}>✦</text>
      <text className="flow-fade" x="46" y="34" fontSize="9" fontWeight="700" fill="#4338ca" letterSpacing="0.05em" style={{ animationDelay: '0.2s' }}>
        YOUR PROMPT
      </text>

      <text className="flow-fade" x="24" y="66" fontSize="11" fontStyle="italic" fill="#374151" style={{ animationDelay: '0.4s' }}>
        Worksheet on animal cells,
      </text>
      <text className="flow-fade" x="24" y="84" fontSize="11" fontStyle="italic" fill="#374151" style={{ animationDelay: '0.62s' }}>
        Year 8, starting easy and
      </text>
      <text className="flow-fade" x="24" y="102" fontSize="11" fontStyle="italic" fill="#374151" style={{ animationDelay: '0.84s' }}>
        building to harder questions.
      </text>

      <rect className="flow-cursor" x="184" y="91" width="2.4" height="13" fill="#4f46e5" style={{ animationDelay: '1.05s, 1.35s' }} />
    </svg>
  )
}

function WorksheetPanel() {
  const lines = [0.85, 0.6, 0.75, 0.4]
  return (
    <svg viewBox="0 0 200 190" className="flow-svg" role="img" aria-label="A print-ready worksheet being generated">
      <rect x="4" y="4" width="192" height="182" rx="12" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <rect className="flow-fade" x="20" y="22" width="130" height="10" rx="3" fill="#111827" style={{ animationDelay: '1.6s' }} />
      <rect className="flow-fade" x="20" y="40" width="80" height="7" rx="3" fill="#9ca3af" style={{ animationDelay: '1.75s' }} />
      {lines.map((w, i) => (
        <rect
          key={i}
          className="flow-fade"
          x="20"
          y={62 + i * 15}
          width={152 * w}
          height="6"
          rx="3"
          fill="#d1d5db"
          style={{ animationDelay: `${1.9 + i * 0.13}s` }}
        />
      ))}
      <g transform="translate(20, 132)">
        <line className="flow-fade" x1="0" y1="40" x2="0" y2="0" stroke="#9ca3af" strokeWidth="2" style={{ animationDelay: '2.5s' }} />
        <line className="flow-fade" x1="0" y1="40" x2="130" y2="40" stroke="#9ca3af" strokeWidth="2" style={{ animationDelay: '2.5s' }} />
        <polyline
          className="flow-draw-el"
          points="12,32 38,16 64,22 92,6 118,14"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animationDelay: '2.65s' }}
        />
      </g>
    </svg>
  )
}

function BubbleSheetPanel() {
  const answerKey = [1, 3, 0, 2, 1]
  return (
    <svg viewBox="0 0 200 190" className="flow-svg" role="img" aria-label="The worksheet becoming an auto-markable bubble sheet">
      <rect x="4" y="4" width="192" height="182" rx="12" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <rect className="flow-fade" x="20" y="22" width="100" height="10" rx="3" fill="#111827" style={{ animationDelay: '3.4s' }} />
      {[...Array(12)].map((_, i) => (
        <rect key={i} className="flow-fade" x={140 + i * 3.6} y="18" width="1.8" height="18" fill="#d1d5db" style={{ animationDelay: '3.4s' }} />
      ))}
      {['A', 'B', 'C', 'D'].map((label, c) => (
        <text key={label} className="flow-fade" x={92 + c * 20} y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6b7280" style={{ animationDelay: '3.5s' }}>
          {label}
        </text>
      ))}
      {answerKey.map((filledCol, r) => (
        <g key={r}>
          <text className="flow-fade" x="20" y={68 + r * 26} fontSize="9" fill="#6b7280" style={{ animationDelay: '3.5s' }}>{r + 1}</text>
          {[0, 1, 2, 3].map(c => {
            const filled = c === filledCol
            return filled ? (
              <circle
                key={c}
                className="flow-pop-el"
                cx={92 + c * 20}
                cy={64 + r * 26}
                r="6.5"
                fill="#4f46e5"
                stroke="#4f46e5"
                strokeWidth="1.6"
                style={{ animationDelay: `${3.7 + r * 0.14}s` }}
              />
            ) : (
              <circle key={c} cx={92 + c * 20} cy={64 + r * 26} r="6.5" fill="#fff" stroke="#d1d5db" strokeWidth="1.6" />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

function FlowArrow({ delay }: { delay: number }) {
  return (
    <div className="flow-arrow" aria-hidden="true">
      <svg viewBox="0 0 60 24" className="flow-arrow-svg">
        <line className="flow-draw-el" x1="2" y1="12" x2="44" y2="12" stroke="#c7d2fe" strokeWidth="3" style={{ animationDelay: `${delay}s` }} />
        <path className="flow-fade" d="M38 4 L54 12 L38 20 Z" fill="#4f46e5" style={{ animationDelay: `${delay + 0.15}s` }} />
      </svg>
    </div>
  )
}

function PromptToBubbleSheetFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`flow${played ? ' flow--played' : ''}`}>
      <div className="flow-step">
        <PromptPanel />
        <p className="flow-step-title">Describe what you need</p>
      </div>
      <FlowArrow delay={1.35} />
      <div className="flow-step">
        <WorksheetPanel />
        <p className="flow-step-title">Get a print-ready worksheet</p>
      </div>
      <FlowArrow delay={3.2} />
      <div className="flow-step">
        <BubbleSheetPanel />
        <p className="flow-step-title">Auto-mark with a bubble sheet</p>
      </div>
    </div>
  )
}

// ── Landing page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="landing" id="top">

      {/* ── Top bar: same as the main app's topbar, different links ── */}
      <header className="topbar">
        <a href="#top" className="topbar-brand">
          <span className="topbar-logo-clip">
            <img src="/logo.svg" className="topbar-logo" alt="The Worksheet Project" />
          </span>
        </a>
        <nav className="topbar-nav">
          <a className="topbar-nav-link" href="#example">Example worksheet</a>
          <a className="topbar-nav-link" href="#features">Features</a>
          <a className="topbar-nav-link" href="#videos">Videos</a>
        </nav>
        <div className="topbar-right">
          <a className="btn-download" href="/onboarding">Log in / Sign up</a>
        </div>
      </header>

      {/* ── Hero: dusty purple gradient, headline only ── */}
      <section className="landing-hero" id="tagline">
        <div className="landing-hero-copy">
          <h1 className="landing-tagline-title">
            Paper-based teaching,<br />powered by AI.
          </h1>
          <p className="landing-tagline-sub">
            The AI worksheet platform that improves with every teacher who uses it.
          </p>
        </div>
      </section>

      {/* ── Prompt → worksheet → bubble sheet flow ── */}
      <section className="landing-flow">
        <PromptToBubbleSheetFlow />
      </section>

      {/* ── Example worksheet + philosophy, side by side ── */}
      <section className="landing-showcase" id="example">
        <PdfClickThrough />
        <PhilosophySummary />
      </section>

      {/* ── Worksheet → bubble sheet feature ── */}
      <section className="landing-mcq" id="features">
        <WorksheetToBubbleSheet />
        <h2 className="landing-mcq-title">From worksheet to bubble sheet</h2>
        <p className="landing-mcq-body">
          Once a class has practised a topic on paper, turn that same content into a personalised
          multiple-choice test — questions and options shuffled per student, so every pupil gets a
          different answer key. Auto-markable, low-effort, and hard to cheat on. Still in development,
          but coming to every scheme of work.
        </p>
        <a className="landing-cta" href="/onboarding">Join the initial trial</a>
      </section>

      {/* ── Videos ── */}
      <section className="landing-videos" id="videos">
        <h2 className="landing-videos-title">See it in action</h2>
        <div className="landing-videos-grid">
          <div className="landing-video-card">
            <div className="landing-video-embed">
              <iframe
                src="https://www.youtube-nocookie.com/embed/kN-pWBYZXjs"
                title="Graph features"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <h3 className="landing-video-card-title">Graph features</h3>
          </div>
          <div className="landing-video-card">
            <div className="landing-video-embed">
              <iframe
                src="https://www.youtube-nocookie.com/embed/aO1_hZk5_dE"
                title="Follow-up quizzes"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <h3 className="landing-video-card-title">Follow-up quizzes</h3>
          </div>
        </div>
      </section>

    </div>
  )
}
