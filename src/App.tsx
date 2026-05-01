import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useWorksheet } from './hooks/useWorksheet'
import { Editor } from './components/editor/Editor'
import { WorksheetPreview } from './components/preview/WorksheetPreview'
import { WorksheetPDF } from './components/pdf/WorksheetPDF'
import './App.css'

export default function App() {
  const { worksheet, dispatch } = useWorksheet()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-brand">Worksheet Builder</span>
        <span className="topbar-version">v0.2 ✓</span>
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
          <WorksheetPreview worksheet={worksheet} />
        </main>
      </div>
    </div>
  )
}
