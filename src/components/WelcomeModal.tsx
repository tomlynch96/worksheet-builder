import { useState } from 'react'
import type { WelcomeConfig } from '../hooks/useAppConfig'
import './WelcomeModal.css'

interface Props {
  config: WelcomeConfig
  onAccept: () => void
}

export function WelcomeModal({ config, onAccept }: Props) {
  const [consented, setConsented] = useState(false)
  const [accepting, setAccepting] = useState(false)

  async function handle() {
    if (!consented) return
    setAccepting(true)
    await onAccept()
  }

  // Render message lines preserving blank lines as paragraph breaks
  const paragraphs = config.message.split(/\n\n+/)

  return (
    <div className="welcome-backdrop">
      <div className="welcome-modal">
        <div className="welcome-logo">WB</div>
        <h1 className="welcome-title">{config.title}</h1>

        <div className="welcome-body">
          {paragraphs.map((para, i) => (
            <p key={i} className="welcome-para">{para}</p>
          ))}
        </div>

        <label className="welcome-consent">
          <input
            type="checkbox"
            checked={consented}
            onChange={e => setConsented(e.target.checked)}
          />
          <span>
            I agree to receive occasional feedback emails from the Worksheet Builder team. I can unsubscribe at any time.
          </span>
        </label>

        <button
          className="welcome-btn"
          disabled={!consented || accepting}
          onClick={handle}
        >
          {accepting ? 'Getting started…' : 'Get started →'}
        </button>
      </div>
    </div>
  )
}
