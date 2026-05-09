import { useState, useRef, useEffect } from 'react'
import type { Worksheet } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { editWorksheetWithAI } from '../../utils/generateWorksheet'
import './AIDialog.css'

interface Props {
  worksheet: Worksheet
  dispatch: React.Dispatch<WorksheetAction>
  onClose: () => void
}

export function AIDialog({ worksheet, dispatch, onClose }: Props) {
  const [request, setRequest] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  async function handleSubmit() {
    const trimmed = request.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    try {
      const updated = await editWorksheetWithAI({ worksheet, request: trimmed })
      dispatch({ type: 'LOAD_WORKSHEET', worksheet: { ...updated, id: worksheet.id } })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="ai-dialog-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ai-dialog">
        <div className="ai-dialog-header">
          <span className="ai-dialog-title">✦ Ask AI to edit this worksheet</span>
          <button type="button" className="ai-dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ai-dialog-body">
          <p className="ai-dialog-hint">
            Describe what you want to change. The AI will update the whole worksheet and replace the current content.
          </p>

          <textarea
            ref={textareaRef}
            className="ai-dialog-textarea"
            rows={4}
            value={request}
            onChange={e => setRequest(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Add three more questions on rearranging the equation, make question 5 harder, add a key facts box at the top…"
            disabled={loading}
          />

          {error && <p className="ai-dialog-error">{error}</p>}

          <div className="ai-dialog-actions">
            <span className="ai-dialog-hint-cmd">⌘↵ to send</span>
            <button type="button" className="ai-dialog-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="ai-dialog-submit"
              onClick={handleSubmit}
              disabled={!request.trim() || loading}
            >
              {loading
                ? <><span className="ai-dialog-spinner" /> Applying…</>
                : '✦ Apply changes'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
