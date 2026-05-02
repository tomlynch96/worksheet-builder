import { createContext, useCallback, useContext, useState } from 'react'

export interface ActiveField {
  id: string
  label: string
  value: string
  onChange: (html: string) => void
  multiline?: boolean
  placeholder?: string
}

interface RichFieldCtx {
  active: ActiveField | null
  setActive: (field: ActiveField) => void
  updateValue: (id: string, value: string) => void
}

const Ctx = createContext<RichFieldCtx>({
  active: null,
  setActive: () => {},
  updateValue: () => {},
})

export function RichFieldProvider({ children }: { children: React.ReactNode }) {
  const [active, setActiveState] = useState<ActiveField | null>(null)

  const setActive = useCallback((field: ActiveField) => {
    setActiveState(field)
  }, [])

  const updateValue = useCallback((id: string, value: string) => {
    setActiveState(prev => prev?.id === id ? { ...prev, value } : prev)
  }, [])

  return (
    <Ctx.Provider value={{ active, setActive, updateValue }}>
      {children}
    </Ctx.Provider>
  )
}

export function useRichField() {
  return useContext(Ctx)
}
