import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Topbar } from '../components/layout/Topbar'
import { Editor } from '../components/editor/Editor'
import { WorksheetPreview } from '../components/preview/WorksheetPreview'
import { WorksheetPDF } from '../components/pdf/WorksheetPDF'
import { useWorksheet } from '../hooks/useWorksheet'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { useEditTracking } from '../hooks/useEditTracking'
import { useProfileContext } from '../context/ProfileContext'
import { PRESETS } from '../data/presets'
import type { Block, Worksheet, ExamBoard, Tier } from '../types/worksheet'
import './EditorPage.css'

export function EditorPage() {
  const { profile } = useProfileContext()
  const { worksheet, dispatch } = useWorksheet()
  const { save } = useSupabaseWorksheets(profile?.id ?? null)
  const { trackEdit } = useEditTracking(profile?.id ?? null)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'worksheet' | 'markscheme'>('worksheet')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const openRef = useRef<HTMLInputElement>(null)

  const originalBlocksRef = useRef<Block[]>([])
  const worksheetTypeRef = useRef<string>('')
  const isAIGeneratedRef = useRef(false)

  const saveRef = useRef(save)
  saveRef.current = save
  const trackEditRef = useRef(trackEdit)
  trackEditRef.current = trackEdit
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
        className={`btn-topbar${worksheet.showLines === false ? ' btn-topbar--active' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_LINES' })}
        title="Toggle answer lines"
      >
        {worksheet.showLines === false ? 'Show lines' : 'Hide lines'}
      </button>

      <button className="btn-topbar" onClick={() => openRef.current?.click()} title="Open a saved worksheet (.json)">
        Open JSON
      </button>
      <button className="btn-topbar" onClick={handleDownloadJSON} title="Download as JSON">
        Export JSON
      </button>
      <input ref={openRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleOpen} />

      <PDFDownloadLink
        key={worksheet.blocks.map(b => b.id).join(',')}
        document={<WorksheetPDF worksheet={worksheet} />}
        fileName="worksheet.pdf"
        className="btn-download"
      >
        {({ loading }) => (loading ? 'Preparing…' : 'Download PDF')}
      </PDFDownloadLink>
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
          />
        </aside>
        <main className="panel-preview">
          <WorksheetPreview
            worksheet={worksheet}
            selectedId={selectedId}
            onSelect={setSelectedId}
            mode={mode}
          />
        </main>
      </div>
    </div>
  )
}
