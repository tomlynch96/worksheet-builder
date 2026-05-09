import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import { isConfigured } from '../lib/supabase'
import './Onboarding.css'

const EXAM_BOARDS = ['AQA', 'OCR', 'Edexcel', 'WJEC']

export function Onboarding() {
  const { createProfile } = useProfileContext()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function courseKey(qualId: string, board: string) {
    return `${qualId}:${board}`
  }

  function toggle(qualId: string, board: string) {
    const key = courseKey(qualId, board)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) { setError('Please select at least one course.'); return }

    setSaving(true)
    setError('')

    const courses = Array.from(selected).map(key => {
      const [qualification_id, exam_board] = key.split(':')
      return { qualification_id, exam_board }
    })

    const ok = await createProfile(name.trim() || 'Teacher', courses)
    if (ok) {
      navigate('/', { replace: true })
    } else {
      setError('Could not save profile — check your Supabase connection.')
      setSaving(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="onboarding-layout">
        <div className="onboarding-card onboarding-card--error">
          <h1 className="onboarding-title">Supabase not configured</h1>
          <p className="onboarding-body">
            Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase project URL and anon key, then restart the dev server.
          </p>
          <pre className="onboarding-code">{`VITE_SUPABASE_URL=https://xxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-layout">
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <div className="onboarding-logo">WB</div>
        <h1 className="onboarding-title">Welcome to Worksheet Builder</h1>
        <p className="onboarding-body">
          Tell us which courses you teach so we can organise your worksheets and pre-fill new ones.
        </p>

        <div className="onboarding-name-row">
          <label className="onboarding-label">Your name (optional)</label>
          <input
            className="onboarding-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mr Smith"
          />
        </div>

        <div className="onboarding-courses">
          <div className="onboarding-label">Which courses do you teach?</div>
          <div className="onboarding-board-key">
            {EXAM_BOARDS.map(b => (
              <span key={b} className="onboarding-board-label">{b}</span>
            ))}
          </div>
          {QUALIFICATION_OFFERINGS.map(qual => (
            <div key={qual.id} className="onboarding-qual-row">
              <span className="onboarding-qual-name">{qual.label}</span>
              <div className="onboarding-boards">
                {EXAM_BOARDS.map(board => {
                  const key = courseKey(qual.id, board)
                  const checked = selected.has(key)
                  return (
                    <button
                      key={board}
                      type="button"
                      className={`onboarding-board-btn${checked ? ' onboarding-board-btn--on' : ''}`}
                      onClick={() => toggle(qual.id, board)}
                      aria-pressed={checked}
                    >
                      {checked ? '✓' : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="onboarding-error">{error}</p>}

        <div className="onboarding-hint">
          {selected.size === 0
            ? 'Select at least one course to continue.'
            : `${selected.size} course${selected.size !== 1 ? 's' : ''} selected`}
        </div>

        <button className="onboarding-submit" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Get started →'}
        </button>
      </form>
    </div>
  )
}
