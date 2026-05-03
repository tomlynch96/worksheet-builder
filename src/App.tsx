import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useWorksheet } from './hooks/useWorksheet'
import { Editor } from './components/editor/Editor'
import { WorksheetPreview } from './components/preview/WorksheetPreview'
import { WorksheetPDF } from './components/pdf/WorksheetPDF'
import { PRESETS } from './data/presets'
import './App.css'

export default function App() {
  const { worksheet, dispatch } = useWorksheet()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)

  function loadPreset(idx: number) {
    dispatch({ type: 'LOAD_PRESET', worksheet: PRESETS[idx].worksheet })
    setSelectedId(null)
    setShowPresets(false)
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

        <PDFDownloadLink
          document={<WorksheetPDF worksheet={worksheet} />}
          fileName="worksheet.pdf"
          className="btn-download"
        >
          {({ loading }) => (loading ? 'Preparing PDF…' : 'Download PDF')}
        </PDFDownloadLink>
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
