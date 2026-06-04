import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { Topbar } from '../components/layout/Topbar'
import { Editor } from '../components/editor/Editor'
import { WorksheetPreview } from '../components/preview/WorksheetPreview'
import { SheetRateModal } from '../components/SheetRateModal'
import { AnnotateNudge } from '../components/editor/AnnotateNudge'
import { PublishExportModal } from '../components/PublishExportModal'
import { useWorksheet } from '../hooks/useWorksheet'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { useEditTracking } from '../hooks/useEditTracking'
import { useAnnotateNudge } from '../hooks/useAnnotateNudge'
import { useProfileContext } from '../context/ProfileContext'
import { supabase, isConfigured } from '../lib/supabase'
import { PRESETS } from '../data/presets'
import { LAYOUT_TEST_WORKSHEET } from '../data/layoutTest'
import type { Block, Worksheet, ExamBoard, Tier } from '../types/worksheet'
import './EditorPage.css'

const printPageStyle = `
  @page { size: 210mm 297mm; margin: 0; }
  html, body { width: 794px; max-width: 794px; margin: 0; padding: 0; overflow: hidden; background: white; }
  .print-only { width: 794px !important; }
  .ws-pages { display: block !important; gap: 0 !important; }
  .a4-page {
    width: 210mm !important;
    height: 297mm !important;
    padding: 18mm !important;
    box-shadow: none !important;
    page-break-after: always;
    break-after: page;
  }
  .a4-page-footer {
    bottom: 18mm !important;
    left: 18mm !important;
    right: 18mm !important;
  }
  [aria-hidden="true"] { display: none !important; }
  .preview-block-wrap { outline: none !important; cursor: default !important; }
  .preview-block-wrap::after { display: none !important; }
`

export function EditorPage() {
  const { profile } = useProfileContext()
  const { worksheet, dispatch } = useWorksheet()
  const { save, publish, entries } = useSupabaseWorksheets(profile?.id ?? null)
  const { trackEdit } = useEditTracking(profile?.id ?? null)
  const nudge = useAnnotateNudge(worksheet.id ?? null)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'worksheet' | 'markscheme'>('worksheet')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showRateModal, setShowRateModal] = useState(false)
  const [sheetRating, setSheetRating] = useState<number | null>(null)
  const [sheetAnnotation, setSheetAnnotation] = useState('')
  const [showNudge, setShowNudge] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const openRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const worksheetTitle = (() => {
    const h = worksheet.blocks.find(b => b.type === 'header')
    return h && 'title' in h ? (h.title as string) : ''
  })()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: worksheetTitle || 'worksheet',
    pageStyle: printPageStyle,
  })

  const originalBlocksRef = useRef<Block[]>([])
  const worksheetTypeRef = useRef<string>('')
  const isAIGeneratedRef = useRef(false)

  const saveRef = useRef(save)
  saveRef.current = save
  const trackEditRef = useRef(trackEdit)
  trackEditRef.current = trackEdit
  const nudgeRef = useRef(nudge)
  nudgeRef.current = nudge
  const worksheetRef = useRef(worksheet)
  worksheetRef.current = worksheet
  const committedRef = useRef(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const triggerAutoSave = useCallback((w: typeof worksheet) => {
    if (!committedRef.current || !profile) return
    clearTimeout(autoSaveTimer.current)
    setSaveStatus('saving')
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const aiMeta = isAIGeneratedRef.current ? {
          worksheetType: worksheetTypeRef.current,
          originalBlocks: originalBlocksRef.current,
        } : undefined
        await saveRef.current(w, aiMeta)
        if (isAIGeneratedRef.current && originalBlocksRef.current.length > 0) {
          await trackEditRef.current(w, originalBlocksRef.current, worksheetTypeRef.current)
          // Check if we should nudge about annotations
          const orig = originalBlocksRef.current
          const curr = w.blocks
          const editCount = curr.filter(b => {
            const o = orig.find(ob => ob.id === b.id)
            return o && JSON.stringify(b) !== JSON.stringify(o)
          }).length + curr.filter(b => !orig.find(ob => ob.id === b.id)).length
          if (nudgeRef.current.shouldNudge(editCount)) {
            setShowNudge(true)
            nudgeRef.current.markNudged()
          }
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 4000)
      }
    }, 1500)
  }, [profile])

  useEffect(() => {
    if (location.state?.worksheet) {
      const ws = location.state.worksheet as Worksheet
      dispatch({ type: 'LOAD_WORKSHEET', worksheet: ws })
      setSelectedId(null)
      if (location.state?.aiGenerated) {
        isAIGeneratedRef.current = true
        originalBlocksRef.current = ws.blocks
        worksheetTypeRef.current = location.state.worksheetType ?? ''
      }
    } else if (typeof location.state?.preset === 'number') {
      dispatch({ type: 'LOAD_PRESET', worksheet: PRESETS[location.state.preset].worksheet })
      setSelectedId(null)
    } else {
      const qual = searchParams.get('qual')
      const board = searchParams.get('board')
      const spec = searchParams.get('spec')
      const topic = searchParams.get('topic')
      if (qual || board) {
        const blank: Worksheet = {
          id: crypto.randomUUID(),
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'header',
              title: '',
              topic: topic || '',
              examBoard: (board as ExamBoard) || 'AQA',
              tier: 'higher' as Tier,
              showName: true,
              showDate: true,
              showClass: true,
              qualification: qual || undefined,
              specPoint: spec || undefined,
            },
            {
              id: crypto.randomUUID(),
              type: 'instructions',
              items: [
                'Answer all questions.',
                'Write your answers in the spaces provided.',
                'The marks for each question are shown in brackets.',
              ],
            },
          ],
        }
        dispatch({ type: 'LOAD_PRESET', worksheet: blank })
        setSelectedId(null)
      }
    }
    const t = setTimeout(() => {
      committedRef.current = true
      triggerAutoSave(worksheetRef.current)
    }, 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    triggerAutoSave(worksheet)
    return () => clearTimeout(autoSaveTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheet])

  const profileSavedRef = useRef(false)
  useEffect(() => {
    if (!profile || profileSavedRef.current) return
    profileSavedRef.current = true
    if (committedRef.current) triggerAutoSave(worksheetRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  // Load existing rating/annotation for the current worksheet
  useEffect(() => {
    if (!worksheet.id || !isConfigured) return
    supabase
      .from('worksheets')
      .select('rating, annotation')
      .eq('id', worksheet.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        const row = data as Record<string, unknown>
        setSheetRating((row.rating as number) ?? null)
        setSheetAnnotation((row.annotation as string) ?? '')
      })
  }, [worksheet.id])

  function handleOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Worksheet
        if (parsed.id && Array.isArray(parsed.blocks)) {
          dispatch({ type: 'LOAD_WORKSHEET', worksheet: parsed })
          setSelectedId(null)
        }
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleAttach(blockId: string, questionId: string) {
    const dragged = worksheet.blocks.find(b => b.id === blockId)
    const target = worksheet.blocks.find(b => b.id === questionId) as { attachedDataId?: string | null; attachedDataIds?: string[] | null } | undefined
    if (!dragged || !target) return
    if (dragged.type === 'figure') {
      dispatch({ type: 'UPDATE_BLOCK', id: questionId, updates: { attachedFigureId: blockId } as Partial<typeof dragged> })
    } else if (dragged.type === 'data') {
      if (target.attachedDataIds?.length) {
        dispatch({ type: 'UPDATE_BLOCK', id: questionId, updates: { attachedDataIds: [...target.attachedDataIds, blockId] } as Partial<typeof dragged> })
      } else if (target.attachedDataId) {
        dispatch({ type: 'UPDATE_BLOCK', id: questionId, updates: { attachedDataIds: [target.attachedDataId, blockId], attachedDataId: null } as Partial<typeof dragged> })
      } else {
        dispatch({ type: 'UPDATE_BLOCK', id: questionId, updates: { attachedDataId: blockId } as Partial<typeof dragged> })
      }
    }
  }

  function handleDownloadJSON() {
    const json = JSON.stringify(worksheet, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const header = worksheet.blocks.find(b => b.type === 'header')
    const title = header && 'title' in header ? (header.title as string) : 'worksheet'
    a.download = `${title.toLowerCase().replace(/\s+/g, '-') || 'worksheet'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveLabel =
    saveStatus === 'saving' ? '● Saving…' :
    saveStatus === 'error'  ? '⚠ Failed' :
    '✓ Saved'

  const topbarActions = (
    <>
      <div className="mode-toggle">
        <button
          className={`mode-toggle-btn${mode === 'worksheet' ? ' mode-toggle-btn--active' : ''}`}
          onClick={() => setMode('worksheet')}
        >Worksheet</button>
        <button
          className={`mode-toggle-btn${mode === 'markscheme' ? ' mode-toggle-btn--active' : ''}`}
          onClick={() => setMode('markscheme')}
        >Mark Scheme</button>
      </div>

      <span className={`editor-save-status editor-save-status--${saveStatus}`}>
        {saveLabel}
      </span>

      <button
        className="btn-topbar"
        onClick={() => setShowRateModal(true)}
        title="Rate and annotate this worksheet"
      >
        {sheetRating ? `${'★'.repeat(sheetRating)} Rate` : '☆ Rate'}
      </button>

      <button
        className={`btn-topbar${worksheet.showLines === false ? ' btn-topbar--active' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_LINES' })}
        title="Toggle answer lines"
      >
        {worksheet.showLines === false ? 'Show lines' : 'Hide lines'}
      </button>

      <button
        className="btn-topbar"
        onClick={() => { dispatch({ type: 'LOAD_WORKSHEET', worksheet: LAYOUT_TEST_WORKSHEET }); setSelectedId(null) }}
        title="Load a calibration worksheet to compare PDF vs preview dimensions"
      >
        Layout Test
      </button>

      <button className="btn-topbar" onClick={() => openRef.current?.click()} title="Open a saved worksheet (.json)">
        Open JSON
      </button>
      <button className="btn-topbar" onClick={handleDownloadJSON} title="Download as JSON">
        Export JSON
      </button>
      <input ref={openRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleOpen} />

      <button
        className="btn-download"
        onClick={() => {
          const existingEntry = entries.find(en => en.id === worksheet.id)
          const alreadyDecided = existingEntry && (existingEntry.is_public || existingEntry.publish_opt_out)
          if (!alreadyDecided) {
            setShowPublishModal(true)
          } else {
            handlePrint()
          }
        }}
      >
        Print / Save PDF
      </button>
    </>
  )

  return (
    <div className="editor-layout">
      <Topbar actions={topbarActions} />
      <div className="editor-workspace">
        <aside className="panel-editor">
          <Editor
            worksheet={worksheet}
            dispatch={dispatch}
            selectedId={selectedId}
            onSelect={setSelectedId}
            worksheetId={worksheet.id}
            profileId={profile?.id}
          />
        </aside>
        <main className="panel-preview">
          <WorksheetPreview
            worksheet={worksheet}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAttach={handleAttach}
            mode={mode}
          />
        </main>
      </div>

      {/* Off-screen on screen; visible in react-to-print iframe (screen media doesn't apply there) */}
      <div ref={printRef} className="print-only">
        <WorksheetPreview worksheet={worksheet} mode="worksheet" />
        <WorksheetPreview worksheet={worksheet} mode="markscheme" />
      </div>
      {showRateModal && (
        <SheetRateModal
          worksheetTitle={worksheetTitle}
          initialRating={sheetRating}
          initialAnnotation={sheetAnnotation}
          onSave={async (rating, annotation) => {
            if (!isConfigured) return
            await supabase
              .from('worksheets')
              .update({ rating, annotation })
              .eq('id', worksheet.id)
            setSheetRating(rating)
            setSheetAnnotation(annotation)
          }}
          onClose={() => setShowRateModal(false)}
        />
      )}
      {showNudge && (
        <AnnotateNudge
          onAddNote={() => { setShowNudge(false); setShowRateModal(true) }}
          onDismiss={() => setShowNudge(false)}
        />
      )}
      {showPublishModal && (
        <PublishExportModal
          authorName={profile?.name ?? 'Teacher'}
          onDecide={async choice => {
            setShowPublishModal(false)
            await publish(worksheet.id, choice)
            handlePrint()
          }}
        />
      )}
    </div>
  )
}
