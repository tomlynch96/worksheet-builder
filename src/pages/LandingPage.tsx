import { useState } from 'react'
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

// ── Landing page ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="landing">

      {/* ── Top bar ── */}
      <header className="landing-topbar">
        <a href="#tagline" className="landing-topbar-brand">
          <span className="landing-topbar-logo-clip">
            <img src="/logo.svg" className="landing-topbar-logo" alt="The Worksheet Project" />
          </span>
        </a>
        <nav className="landing-topbar-nav">
          <a className="landing-topbar-link" href="#example">Example worksheet</a>
          <a className="landing-topbar-link" href="#features">Features</a>
          <a className="landing-topbar-link" href="#videos">Videos</a>
        </nav>
        <a className="landing-topbar-cta" href="/onboarding">Log in / Sign up</a>
      </header>

      {/* ── Hero: huge logo, headline beside it ── */}
      <section className="landing-hero" id="tagline">
        <div className="landing-logo-clip">
          <img src="/logo.svg" className="landing-logo-img" alt="The Worksheet Project" />
        </div>
        <div className="landing-hero-copy">
          <h1 className="landing-tagline-title">
            Paper-based teaching,<br />powered by AI.
          </h1>
          <p className="landing-tagline-sub">
            The AI worksheet platform that improves with every teacher who uses it.
          </p>
        </div>
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
