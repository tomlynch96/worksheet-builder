import { useState, useRef } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useWorksheet } from './hooks/useWorksheet'
import { Editor } from './components/editor/Editor'
import { WorksheetPreview } from './components/preview/WorksheetPreview'
import { WorksheetPDF } from './components/pdf/WorksheetPDF'
import { PRESETS } from './data/presets'
import type { Worksheet } from './types/worksheet'
import './App.css'

export default function App() {
  const { worksheet, dispatch } = useWorksheet()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)
  const openRef = useRef<HTMLInputElement>(null)

  function loadPreset(idx: number) {
    dispatch({ type: 'LOAD_PRESET', worksheet: PRESETS[idx].worksheet })
    setSelectedId(null)
    setShowPresets(false)
  }

  function handleSave() {
    const json = JSON.stringify(worksheet, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const header = worksheet.blocks.find(b => b.type === 'header')
    const title = header && 'title' in header ? header.title : 'worksheet'
    a.download = `${(title as string).toLowerCase().replace(/\s+/g, '-') || 'worksheet'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-brand">Worksheet Builder</span>

        <div className="topbar-presets">
          <button className="btn-presets" onClick={() => setShowPresets(v => !v)}>
            Templates ▾
          </button>
          {showPresets && (
            <>
              <div className="presets-backdrop" onClick={() => setShowPresets(false)} />
              <div className="presets-dropdown">
                <p className="presets-hint">Load a template — replaces current content</p>
                {PRESETS.map((p, i) => (
                  <button key={i} className="preset-option" onClick={() => loadPreset(i)}>
                    <span className="preset-label">{p.label}</span>
                    <span className="preset-desc">{p.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="topbar-actions">
          <button className="btn-topbar" onClick={() => openRef.current?.click()} title="Open a saved worksheet (.json)">
            Open
          </button>
          <button className="btn-topbar" onClick={handleSave} title="Save worksheet as JSON file">
            Save
          </button>
          <input ref={openRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleOpen} />
          <PDFDownloadLink
            key={worksheet.blocks.map(b => b.id).join(',')}
            document={<WorksheetPDF worksheet={worksheet} />}
            fileName="worksheet.pdf"
            className="btn-download"
          >
            {({ loading }) => (loading ? 'Preparing PDF…' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
      </header>

      <div className="workspace">
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
          />
        </main>
      </div>
    </div>
  )
}
