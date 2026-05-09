import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Topbar } from '../components/layout/Topbar'
import { Editor } from '../components/editor/Editor'
import { WorksheetPreview } from '../components/preview/WorksheetPreview'
import { WorksheetPDF } from '../components/pdf/WorksheetPDF'
import { useWorksheet } from '../hooks/useWorksheet'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { useProfileContext } from '../context/ProfileContext'
import { buildAIPrompt } from '../utils/aiPrompt'
import { PRESETS } from '../data/presets'
import type { Worksheet, ExamBoard, Tier } from '../types/worksheet'
import './EditorPage.css'

export function EditorPage() {
  const { profile } = useProfileContext()
  const { worksheet, dispatch } = useWorksheet()
  const { save } = useSupabaseWorksheets(profile?.id ?? null)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'worksheet' | 'markscheme'>('worksheet')
  const [promptCopied, setPromptCopied] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const openRef = useRef<HTMLInputElement>(null)

  // Autosave — skip the initial render(s) while the worksheet loads
  const saveRef = useRef(save)
  saveRef.current = save
  const committedRef = useRef(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const triggerAutoSave = useCallback((w: typeof worksheet) => {
    if (!committedRef.current || !profile) return
    clearTimeout(autoSaveTimer.current)
    setSaveStatus('saving')
    autoSaveTimer.current = setTimeout(async () => {
      await saveRef.current(w)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1500)
  }, [profile])

  // Load worksheet from navigation state or wizard query params, then enable autosave
  useEffect(() => {
    if (location.state?.worksheet) {
      dispatch({ type: 'LOAD_WORKSHEET', worksheet: location.state.worksheet as Worksheet })
      setSelectedId(null)
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
    // Allow React to flush the new worksheet state before we start watching changes
    const t = setTimeout(() => { committedRef.current = true }, 200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave on every change once committed
  useEffect(() => {
    triggerAutoSave(worksheet)
    return () => clearTimeout(autoSaveTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheet])

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

  function handleCopyPrompt() {
    navigator.clipboard.writeText(buildAIPrompt(worksheet)).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    })
  }

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
        {saveStatus === 'saving' && '● Saving…'}
        {saveStatus === 'saved' && '✓ Saved'}
      </span>

      <button className="btn-topbar" onClick={() => navigate('/')}>← Home</button>

      <button className="btn-topbar" onClick={() => openRef.current?.click()} title="Open a saved worksheet (.json)">
        Open
      </button>
      <button className="btn-topbar" onClick={handleDownloadJSON} title="Download as JSON">
        Export JSON
      </button>
      <input ref={openRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleOpen} />
      <button
        className="btn-topbar btn-topbar--ai"
        onClick={handleCopyPrompt}
        title="Copy AI prompt to generate a worksheet JSON"
      >
        {promptCopied ? 'Copied!' : 'Copy AI Prompt'}
      </button>
      <PDFDownloadLink
        key={worksheet.blocks.map(b => b.id).join(',')}
        document={<WorksheetPDF worksheet={worksheet} />}
        fileName="worksheet.pdf"
        className="btn-download"
      >
        {({ loading }) => (loading ? 'Preparing PDF…' : 'Download PDF')}
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
