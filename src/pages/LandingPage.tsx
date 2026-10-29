import { useEffect, useRef, useState, type ReactNode } from 'react'
import '../components/layout/Topbar.css'
import './LandingPage.css'

const AI_USE_SOURCE_URL = 'https://neu.org.uk/latest/press-releases/state-education-2026-ai'

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

// ── What a good worksheet looks like ────────────────────────────────────────

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
      <h3 className="philosophy-title">What I think a good worksheet looks like</h3>
      <ul className="philosophy-list">
        {PHILOSOPHY_POINTS.map(point => (
          <li key={point.title} className="philosophy-item">
            <span className="philosophy-item-title">{point.title}</span>
            <span className="philosophy-item-body">{point.body}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Framed screenshot ───────────────────────────────────────────────────────

function Shot({ src, alt, caption, crop, maxWidth }: { src: string; alt: string; caption?: string; crop?: string; maxWidth?: number }) {
  return (
    <figure className="shot" style={maxWidth ? { maxWidth } : undefined}>
      <div className="shot-frame" style={crop ? { aspectRatio: crop } : undefined}>
        <img src={src} alt={alt} className={`shot-img${crop ? ' shot-img--crop' : ''}`} />
      </div>
      {caption && <figcaption className="shot-caption">{caption}</figcaption>}
    </figure>
  )
}

// ── Problem → approach section ──────────────────────────────────────────────

interface ProblemSectionProps {
  id: string
  number: number
  title: string
  status: 'working' | 'experimental'
  problem: ReactNode
  approach: ReactNode[]
  media: ReactNode
  reverse?: boolean
  tint?: boolean
  children?: ReactNode
}

function ProblemSection({ id, number, title, status, problem, approach, media, reverse, tint, children }: ProblemSectionProps) {
  return (
    <section className={`problem${tint ? ' problem--tint' : ''}`} id={id}>
      <div className={`problem-inner${reverse ? ' problem-inner--reverse' : ''}`}>
        <div className="problem-copy">
          <div className="problem-meta">
            <span className="problem-number">{String(number).padStart(2, '0')}</span>
            <span className={`problem-status problem-status--${status}`}>
              {status === 'working' ? 'Working now' : 'Experimental'}
            </span>
          </div>
          <h2 className="problem-title">{title}</h2>

          <p className="problem-label">The problem</p>
          <p className="problem-text">{problem}</p>

          <p className="problem-label problem-label--approach">What I'm doing about it</p>
          <ul className="problem-approach">
            {approach.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
        <div className="problem-media">{media}</div>
      </div>
      {children}
    </section>
  )
}

// ── Hero background: pinned to the viewport but clipped to the hero, fades in
//    once loaded and fades out as you scroll down ──────────────────────────

const HERO_BG_URL = '/Background.svg'

function HeroBackground() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setLoaded(true)
    img.src = HERO_BG_URL
  }, [])

  useEffect(() => {
    // Browsers with scroll-driven animations fade it in CSS, in step with scrolling
    if (CSS.supports('animation-timeline: scroll()')) return
    let frame = 0
    const update = () => {
      frame = 0
      const el = scrollRef.current
      if (!el) return
      // Fully faded by the time you've scrolled most of a screen
      const progress = Math.min(1, window.scrollY / (window.innerHeight * 0.7))
      el.style.opacity = String(1 - progress)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="landing-hero-bg" aria-hidden="true">
      <div className="landing-hero-bg-pin">
        <div ref={scrollRef} className="landing-hero-bg-scroll">
          <div className={`landing-hero-bg-art${loaded ? ' landing-hero-bg-art--loaded' : ''}`} />
        </div>
      </div>
    </div>
  )
}

// ── Landing page ─────────────────────────────────────────────────────────────

const PROBLEMS = [
  { id: 'formatting', label: 'The formatting fights you' },
  { id: 'sharing', label: 'Everyone starts from scratch' },
  { id: 'learning', label: 'Edits teach the AI nothing' },
  { id: 'quality', label: 'Convenience beats excellence' },
  { id: 'experiments', label: 'Nobody is rethinking the worksheet' },
]

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
          <a className="topbar-nav-link" href="#problems">The problems</a>
          <a className="topbar-nav-link" href="#experiments">Experiments</a>
          <a className="topbar-nav-link" href="#why">Why paper</a>
        </nav>
        <div className="topbar-right">
          <a className="btn-download" href="/onboarding">Log in / Sign up</a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero" id="tagline">
        <HeroBackground />
        <div className="landing-hero-copy">
          <span className="landing-hero-pill">A work in progress · built by a teacher</span>
          <h1 className="landing-tagline-title">
            Teachers already use AI to make worksheets. What if that effort added up?
          </h1>
          <p className="landing-tagline-sub">
            The Worksheet Project is my open experiment in AI-assisted resource creation —
            one that builds on teachers' work instead of throwing it away.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-cta" href="/onboarding">Sign up</a>
            <a className="landing-hero-link" href="#problems">Read what I'm trying ↓</a>
          </div>
        </div>
      </section>

      {/* ── Context + contents ── */}
      <section className="landing-context" id="problems">
        <div className="landing-context-inner">
          <p className="landing-context-lead">
            Making resources is{' '}
            <a href={AI_USE_SOURCE_URL} target="_blank" rel="noopener noreferrer">
              teachers' main interaction with AI
            </a>
            . But the way we do it now has five problems, and this project is my attempt at each of them.
          </p>
          <ol className="landing-contents">
            {PROBLEMS.map((p, i) => (
              <li key={p.id}>
                <a href={`#${p.id}`}>
                  <span className="landing-contents-num">{String(i + 1).padStart(2, '0')}</span>
                  {p.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ProblemSection
        id="formatting"
        number={1}
        title="The formatting fights you"
        status="working"
        problem="Ask a chatbot for a worksheet and the layout is different every time. By the time it's been wrestled into something printable, it would often have been quicker to start from scratch."
        approach={[
          'Every worksheet uses a fixed layout built from a small set of block types, each with sensible constraints.',
          'Removing or reordering a block is effortless. Mark schemes are stored with their question, so they move and disappear with it.',
          'What you see on the page is exactly what prints.',
          'AI requests deal with one block at a time, so nothing elsewhere on the worksheet changes underneath you.',
        ]}
        media={
          <div className="media-stack">
            <Shot src="/features/blocks.png" alt="The block picker menu showing question types like Multiple choice, Cloze activity and Worked example" caption="Choose the next block — you make the pedagogical decision." />
            <Shot src="/features/mark-scheme.png" alt="A toggle switching between the worksheet view and the mark scheme view" caption="One toggle between the worksheet and its mark scheme." maxWidth={300} />
          </div>
        }
      />

      <ProblemSection
        id="sharing"
        number={2}
        title="Everyone starts from scratch"
        status="working"
        tint
        reverse
        problem="Teachers up and down the country make the same worksheet on the same topic, independently, every week. We keep producing mediocre resources instead of our efforts building towards something excellent for everyone."
        approach={[
          'Finished worksheets are shared publicly by default, tagged against specification points and searchable by keyword.',
          'Anyone can copy a worksheet into their own library and develop it further.',
          'Diagrams the AI draws are added automatically to an open, searchable library, where they can be adjusted (changing the values, for example) and reused.',
        ]}
        media={
          <div className="media-stack">
            <Shot src="/features/public-library.png" alt="The public library: worksheet cards tagged by spec point, exam board and tier" caption="The public library, filterable by spec point." crop="16 / 10" />
            <Shot src="/features/diagram-library.png" alt="The diagram studio library with searchable gravitational field diagrams" caption="The shared diagram library." />
          </div>
        }
      />

      <ProblemSection
        id="learning"
        number={3}
        title="Edits teach the AI nothing"
        status="working"
        problem="Most editing happens outside the tool — in Word, on paper, in your head. Our preferences never feed back, so next time the AI makes exactly the same choices we just corrected."
        approach={[
          'Edits happen natively and are tracked, and you can leave a short note on why you changed something.',
          'AI reads those notes, generates insights about your style, and feeds them into the prompt whenever you generate a new worksheet.',
          'A star rating pulls the best resources through as exemplars for the prompt.',
        ]}
        media={
          <Shot src="/features/insights.png" alt="The Edit Insights page showing an active feedback loop and AI-written insights about editing patterns" caption="Edit Insights: what the AI has learned from my own annotations." />
        }
      />

      <ProblemSection
        id="quality"
        number={4}
        title="Convenience beats excellence"
        status="working"
        tint
        reverse
        problem="Most platforms cater for convenience: one click, a whole worksheet, done. That's quick, but it rarely produces something genuinely excellent — and that's what's worth sharing."
        approach={[
          "It's designed with best practice in mind, and it does need your input: you decide how pupils will show their understanding of an idea, and in what sequence.",
          'Worked examples are generated to guide pupils through the process before they try it themselves.',
          'Graph and data blocks allow the careful embedding of key skills.',
          'Lists of bottom-line numerical answers encourage effective self-assessment and boost confidence.',
        ]}
        media={
          <div className="media-stack">
            <Shot src="/features/graph.png" alt="A graph question editor with a data table and blank labelled axes ready for pupils to plot" caption="Graph blocks: AI seeds the data, you decide how much pupils do with it." />
            <Shot src="/features/worked-examples.png" alt="A worked example editor showing a step-by-step model answer" caption="Worked examples model the process before pupils try it." />
            <Shot src="/features/numerical-answers.png" alt="A numerical answers box with a scrambled list of possible answers" caption="Numerical answers for pupils to check against." crop="1378 / 300" />
          </div>
        }
      >
        <div className="landing-showcase" id="example">
          <PdfClickThrough />
          <PhilosophySummary />
        </div>
      </ProblemSection>

      <ProblemSection
        id="experiments"
        number={5}
        title="Nobody is rethinking the worksheet"
        status="experimental"
        problem="The worksheet itself hasn't changed in decades. AI makes it cheap to try ideas that used to be impractical, so I'm experimenting."
        approach={[
          "Self-marking follow-up multiple-choice quizzes: scannable bubble sheets, in as many versions as you need so you can be confident pupils aren't copying.",
          'A booklet generator that combines several worksheets into a single printed booklet.',
          'Schemes of learning: plan topics across the year, and recall questions on everything learnt so far are generated in an instant.',
        ]}
        media={
          <div className="media-stack">
            <Shot src="/features/schemes.png" alt="A scheme of learning calendar with topics laid out across weeks and recall points marked" caption="Schemes of learning, with recall points along the year." />
            <Shot src="/features/follow-ups.png" alt="A bubble-sheet follow-up quiz with a QR code to scan and mark" caption="Follow-up quizzes, scanned and marked automatically." />
            <Shot src="/features/booklet.png" alt="The booklet composer with a worksheet list and contents page" caption="The booklet composer." />
          </div>
        }
      >
        <div className="landing-videos">
          <h3 className="landing-videos-title">See it in action</h3>
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
              <p className="landing-video-card-title">Graph features</p>
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
              <p className="landing-video-card-title">Follow-up quizzes</p>
            </div>
          </div>
        </div>
      </ProblemSection>

      {/* ── Why paper: personal note ── */}
      <section className="landing-why" id="why">
        <div className="landing-why-inner">
          <h2 className="landing-why-title">Why I'm building this</h2>
          <p>
            This is now my genuine go-to tool whenever I need a worksheet.
          </p>
          <p>
            I, and many others, want to keep student-facing AI and one-to-one devices out of
            classrooms. Pupils should be thinking on paper, not on screens. So everything here ends
            in something you print.
          </p>
          <p>
            But I'm still excited about the innovation AI can bring, especially putting the power of
            resource creation in the hands of teachers rather than publishers. If enough of us use
            it, share what we make and refine each other's work, the best version of every worksheet
            can rise to the top.
          </p>
          <p className="landing-why-sign">— Tom</p>
        </div>
      </section>

      {/* ── Closing call to action ── */}
      <section className="landing-close">
        <h2 className="landing-close-title">Try it, and help shape what it becomes.</h2>
        <a className="landing-cta" href="/onboarding">Sign up</a>
      </section>

    </div>
  )
}
