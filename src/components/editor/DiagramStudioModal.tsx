import { useEffect, useMemo, useRef, useState } from 'react'
import type { DiagramVariable, FigureDiagram, LibraryDiagram } from '../../types/diagram'
import { generateDiagram, type DiagramDraft, type GeneratedQuestion } from '../../utils/generateDiagram'
import { fillText, renderDiagram, svgDataUrl } from '../../utils/diagramSvg'
import { useDiagramLibrary } from '../../hooks/useDiagramLibrary'
import { useDiagramContext } from './DiagramContext'
import './DiagramStudioModal.css'

export interface DiagramStudioResult {
  diagram: FigureDiagram
  caption: string
  question: GeneratedQuestion | null   // still has {{key}} placeholders; fill with diagram.variables
}

interface Props {
  initial?: FigureDiagram
  initialCaption?: string
  initialRequest?: string          // auto-submitted on open (question prompt that asked for a diagram)
  questionMode?: 'none' | 'optional' | 'on'
  questionContext?: string
  startTab?: 'generate' | 'library'
  onApply: (result: DiagramStudioResult) => void | Promise<void>
  onClose: () => void
}

const PRESETS: { label: string; prompt: string }[] = [
  { label: 'Planet orbiting a star', prompt: 'A planet in a circular orbit around a star. Label the orbital radius r with a dimension line, show the planet\'s velocity as a tangent arrow and the gravitational force on the planet towards the star.' },
  { label: 'Field lines & equipotentials', prompt: 'Electric field lines (solid, arrowed) and lines of equipotential (dashed) around a positive point charge, with the potential of each equipotential labelled.' },
  { label: 'Pendulum', prompt: 'A simple pendulum: string of length L from a fixed support, bob of mass m displaced by angle θ from the vertical. Show the vertical as a dashed line, the angle arc, the string length with a dimension line and the bob\'s lowest position dashed.' },
  { label: 'Circular path', prompt: 'An object moving at constant speed in a horizontal circular path. Label the radius r, show the direction of motion with an arrow on the path, the velocity as a tangent arrow and the centripetal force towards the centre.' },
  { label: 'Inclined plane', prompt: 'A block on a rough slope inclined at angle θ to the horizontal. Show weight, normal contact force and friction as labelled arrows, and the angle of the slope.' },
  { label: 'Projectile', prompt: 'A ball projected from level ground at angle θ above the horizontal with initial speed u. Dashed parabolic trajectory, maximum height h and range R marked with dimension lines.' },
  { label: 'Refraction', prompt: 'A ray of light passing from air into a rectangular glass block. Dashed normal, angle of incidence i and angle of refraction r labelled with arcs.' },
  { label: 'Circuit', prompt: 'A series circuit with a cell, a fixed resistor, a filament lamp and an ammeter, with a voltmeter connected in parallel across the resistor. Label the cell p.d. and the resistance.' },
]

type Snapshot = { draft: DiagramDraft; prompts: string[] }

function libraryToDraft(d: LibraryDiagram): DiagramDraft {
  return {
    title: d.title, description: d.description, caption: '',
    template: d.svg_template, variables: d.variables,
    topics: d.topics, specPoints: d.spec_points, question: null,
  }
}

export function DiagramStudioModal({
  initial, initialCaption, initialRequest, questionMode = 'none', questionContext,
  startTab = 'generate', onApply, onClose,
}: Props) {
  const ctx = useDiagramContext()
  const library = useDiagramLibrary(ctx.profileId)

  const [tab, setTab] = useState<'generate' | 'library'>(startTab)
  const [draft, setDraft] = useState<DiagramDraft | null>(() => initial ? {
    title: '', description: '', caption: initialCaption ?? '',
    template: initial.template, variables: initial.variables,
    topics: ctx.topic ? [ctx.topic] : [], specPoints: ctx.specPoint ? [ctx.specPoint] : [], question: null,
  } : null)
  const [prompts, setPrompts] = useState<string[]>(initial?.prompts ?? [])
  const [undoStack, setUndoStack] = useState<Snapshot[]>([])
  const [request, setRequest] = useState(initialRequest ?? '')
  const [includeQuestion, setIncludeQuestion] = useState(questionMode === 'on')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const [caption, setCaption] = useState(initialCaption ?? '')
  // Library row the current drawing came from, and its template, so we can tell
  // a straight reuse (bump use_count) from a refinement (save as a new version).
  const [source, setSource] = useState<{ id: string; template: string } | null>(
    initial?.libraryId ? { id: initial.libraryId, template: initial.template } : null,
  )
  const [libText, setLibText] = useState('')
  const [libSpecOnly, setLibSpecOnly] = useState(!!ctx.specPoint)
  const autoSubmitted = useRef(false)

  const rendered = useMemo(() => draft ? renderDiagram(draft.template, draft.variables) : '', [draft])

  async function submit(text = request) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    try {
      const next = await generateDiagram({
        request: trimmed,
        context: ctx.context,
        includeQuestion: questionMode !== 'none' && includeQuestion,
        questionContext,
        current: draft ? { template: draft.template, variables: draft.variables } : undefined,
        history: prompts,
      })
      if (draft) setUndoStack(s => [...s, { draft, prompts }])
      // Keep tags the teacher has already curated; merge in the worksheet's own
      const merge = (a: string[], b: string[]) => Array.from(new Set([...a, ...b].map(s => s.trim()).filter(Boolean)))
      setDraft({
        ...next,
        topics: merge(draft?.topics ?? (ctx.topic ? [ctx.topic] : []), next.topics),
        specPoints: merge(draft?.specPoints ?? (ctx.specPoint ? [ctx.specPoint] : []), next.specPoints),
        question: next.question ?? (includeQuestion ? draft?.question ?? null : null),
      })
      if (!caption && next.caption) setCaption(next.caption)
      setPrompts(p => [...p, trimmed])
      setRequest('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialRequest && !autoSubmitted.current) {
      autoSubmitted.current = true
      submit(initialRequest)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'library') library.search({ text: libText, specPoint: libSpecOnly ? ctx.specPoint : undefined })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, libSpecOnly])

  function undo() {
    const last = undoStack[undoStack.length - 1]
    if (!last) return
    setDraft(last.draft)
    setPrompts(last.prompts)
    setUndoStack(s => s.slice(0, -1))
  }

  function updateVariable(key: string, updates: Partial<DiagramVariable>) {
    setDraft(d => d && { ...d, variables: d.variables.map(v => v.key === key ? { ...v, ...updates } : v) })
  }

  function updateTags(field: 'topics' | 'specPoints', text: string) {
    setDraft(d => d && { ...d, [field]: text.split(',').map(s => s.trim()).filter(Boolean) })
  }

  function pickFromLibrary(d: LibraryDiagram) {
    if (draft) setUndoStack(s => [...s, { draft, prompts }])
    setDraft(libraryToDraft(d))
    setPrompts(d.prompts ?? [])
    setSource({ id: d.id, template: d.svg_template })
    setTab('generate')
  }

  async function apply() {
    if (!draft) return
    setApplying(true)
    let libraryId: string | undefined
    if (source && source.template === draft.template) {
      libraryId = source.id
      library.recordUse(source.id)
    } else if (saveToLibrary) {
      libraryId = await library.save({
        title: draft.title || caption || 'Diagram',
        description: draft.description,
        template: draft.template,
        variables: draft.variables,
        specPoints: draft.specPoints,
        topics: draft.topics,
        examBoard: ctx.examBoard,
        qualification: ctx.qualification,
        prompts,
        parentId: source?.id,
      }) ?? undefined
    }
    try {
      await onApply({
        diagram: { template: draft.template, variables: draft.variables, libraryId, prompts },
        caption,
        question: questionMode !== 'none' && includeQuestion ? draft.question : null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setApplying(false)
    }
  }

  const fill = (s?: string) => draft ? fillText(s ?? '', draft.variables) : ''
  const busy = loading || applying

  return (
    <div className="ds-backdrop" onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="ds-modal" role="dialog" aria-label="Diagram studio">
        <div className="ds-header">
          <span className="ds-title">✦ Diagram studio</span>
          <div className="ds-tabs">
            <button type="button" className={tab === 'generate' ? 'is-active' : ''} onClick={() => setTab('generate')}>Generate</button>
            <button type="button" className={tab === 'library' ? 'is-active' : ''} onClick={() => setTab('library')}>Library</button>
          </div>
          <button type="button" className="ds-close" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>

        {tab === 'library' ? (
          <div className="ds-library">
            <div className="ds-library-search">
              <input
                value={libText}
                onChange={e => setLibText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') library.search({ text: libText, specPoint: libSpecOnly ? ctx.specPoint : undefined }) }}
                placeholder="Search diagrams, e.g. pendulum, orbit, field lines…"
              />
              {ctx.specPoint && (
                <label className="ds-check">
                  <input type="checkbox" checked={libSpecOnly} onChange={e => setLibSpecOnly(e.target.checked)} />
                  Only {ctx.specPoint}
                </label>
              )}
              <button type="button" className="ds-btn" onClick={() => library.search({ text: libText, specPoint: libSpecOnly ? ctx.specPoint : undefined })}>Search</button>
            </div>
            {library.error && <p className="ds-error">{library.error}</p>}
            {library.loading ? <p className="ds-muted">Searching…</p> : library.results.length === 0 ? (
              <p className="ds-muted">No saved diagrams match yet. Generate one and it will be shared here for other teachers.</p>
            ) : (
              <div className="ds-library-grid">
                {library.results.map(d => (
                  <button key={d.id} type="button" className="ds-library-card" onClick={() => pickFromLibrary(d)}>
                    <img src={svgDataUrl(renderDiagram(d.svg_template, d.variables))} alt={d.title} />
                    <span className="ds-library-card-title">{d.title}</span>
                    <span className="ds-library-card-meta">
                      {[...d.spec_points, ...d.topics].slice(0, 3).join(' · ')}
                      {d.use_count > 1 && ` · used ${d.use_count}×`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="ds-body">
            <div className="ds-canvas">
              {draft ? (
                <img className="ds-preview" src={svgDataUrl(rendered)} alt={draft.title || 'Diagram preview'} />
              ) : (
                <div className="ds-placeholder">
                  {loading ? <><span className="ds-spinner" /> Drawing your diagram…</> : 'Describe a diagram or pick a starting point →'}
                </div>
              )}
              {loading && draft && <div className="ds-canvas-busy"><span className="ds-spinner" /> Updating…</div>}

              {draft && draft.variables.length > 0 && (
                <div className="ds-vars">
                  <span className="ds-section-label">Labelled values</span>
                  {draft.variables.map(v => (
                    <div key={v.key} className="ds-var-row">
                      <span className="ds-var-label" title={`{{${v.key}}}`}>{v.label}</span>
                      <input className="ds-var-value" value={v.value} onChange={e => updateVariable(v.key, { value: e.target.value })} />
                      <input className="ds-var-unit" value={v.unit ?? ''} onChange={e => updateVariable(v.key, { unit: e.target.value })} placeholder="unit" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ds-side">
              {!draft && !loading && (
                <div className="ds-presets">
                  {PRESETS.map(p => (
                    <button key={p.label} type="button" className="ds-chip" onClick={() => setRequest(p.prompt)}>{p.label}</button>
                  ))}
                </div>
              )}

              <textarea
                className="ds-textarea"
                rows={draft ? 2 : 4}
                value={request}
                onChange={e => setRequest(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
                placeholder={draft
                  ? 'Fine-tune: e.g. move the angle label outside the arc, add a velocity arrow, make the string longer…'
                  : 'e.g. A mass on a spring oscillating vertically, with the equilibrium position dashed and amplitude A labelled'}
                disabled={busy}
                autoFocus
              />

              {questionMode !== 'none' && (
                <label className="ds-check">
                  <input type="checkbox" checked={includeQuestion} onChange={e => setIncludeQuestion(e.target.checked)} disabled={busy} />
                  Also write the question that uses this diagram
                </label>
              )}

              <div className="ds-actions-row">
                <span className="ds-muted">⌘↵</span>
                <button type="button" className="ds-btn ds-btn--primary" onClick={() => submit()} disabled={!request.trim() || busy}>
                  {loading ? <><span className="ds-spinner ds-spinner--light" /> Working…</> : draft ? '✦ Refine' : '✦ Generate'}
                </button>
              </div>
              {draft && questionMode !== 'none' && includeQuestion && !draft.question && !loading && (
                <button type="button" className="ds-btn" onClick={() => submit('Keep the diagram exactly as it is. Write the question that uses it.')}>
                  ✦ Write a question for this diagram
                </button>
              )}

              {error && <p className="ds-error">{error}</p>}

              {prompts.length > 0 && (
                <div className="ds-history">
                  <span className="ds-section-label">History</span>
                  <ol>{prompts.map((p, i) => <li key={i}>{p}</li>)}</ol>
                </div>
              )}

              {draft?.question && includeQuestion && (
                <div className="ds-question">
                  <span className="ds-section-label">Question</span>
                  <p>{fill(draft.question.stem)}{!draft.question.parts.length && ` [${draft.question.marks}]`}</p>
                  {draft.question.parts.map(p => <p key={p.label}>({p.label}) {fill(p.stem)} [{p.marks}]</p>)}
                </div>
              )}

              {draft && (
                <div className="ds-meta">
                  <label>
                    <span className="ds-section-label">Caption</span>
                    <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Figure 1" />
                  </label>
                  <label>
                    <span className="ds-section-label">Spec points</span>
                    <input defaultValue={draft.specPoints.join(', ')} key={`sp-${prompts.length}`} onBlur={e => updateTags('specPoints', e.target.value)} placeholder="e.g. AQA-P4.3.2" />
                  </label>
                  <label>
                    <span className="ds-section-label">Topics</span>
                    <input defaultValue={draft.topics.join(', ')} key={`tp-${prompts.length}`} onBlur={e => updateTags('topics', e.target.value)} placeholder="e.g. Circular motion, Forces" />
                  </label>
                  {!(source && source.template === draft.template) && ctx.profileId && (
                    <label className="ds-check">
                      <input type="checkbox" checked={saveToLibrary} onChange={e => setSaveToLibrary(e.target.checked)} />
                      Share in the diagram library, tagged as above
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="ds-footer">
          <button type="button" className="ds-btn" onClick={undo} disabled={!undoStack.length || busy}>↶ Undo</button>
          <span className="ds-spacer" />
          <button type="button" className="ds-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="ds-btn ds-btn--primary" onClick={apply} disabled={!draft || busy}>
            {applying ? <><span className="ds-spinner ds-spinner--light" /> Adding…</> : 'Use diagram'}
          </button>
        </div>
      </div>
    </div>
  )
}
