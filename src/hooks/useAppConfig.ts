import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export interface WelcomeConfig {
  title: string
  message: string
}

const DEFAULTS: WelcomeConfig = {
  title: 'Welcome to Worksheet Builder — Early Access',
  message: 'Thanks for joining the trial. This is a free tool built for secondary science teachers.',
}

export function useWelcomeConfig() {
  const [config, setConfig] = useState<WelcomeConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['welcome_title', 'welcome_message'])
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map(r => [r.key, r.value]))
          setConfig({
            title: map['welcome_title'] ?? DEFAULTS.title,
            message: map['welcome_message'] ?? DEFAULTS.message,
          })
        }
        setLoading(false)
      })
  }, [])

  async function save(next: WelcomeConfig): Promise<boolean> {
    if (!isConfigured) return false
    setSaving(true)
    const { error } = await supabase.from('app_config').upsert([
      { key: 'welcome_title',   value: next.title },
      { key: 'welcome_message', value: next.message },
    ])
    setSaving(false)
    if (!error) setConfig(next)
    return !error
  }

  return { config, loading, saving, save }
}
