import { createContext, useCallback, useContext, useState } from 'react'
import type { Editor } from '@tiptap/react'

interface ActiveEditorCtx {
  editor: Editor | null
  setEditor: (e: Editor | null) => void
}

const Ctx = createContext<ActiveEditorCtx>({ editor: null, setEditor: () => {} })

export function ActiveEditorProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditorState] = useState<Editor | null>(null)
  const setEditor = useCallback((e: Editor | null) => setEditorState(e), [])
  return <Ctx.Provider value={{ editor, setEditor }}>{children}</Ctx.Provider>
}

export function useActiveEditor() {
  return useContext(Ctx)
}
