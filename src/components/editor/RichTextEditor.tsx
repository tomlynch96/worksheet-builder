import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Underline from '@tiptap/extension-underline'
import { MathInline } from './MathInline'
import { ChemInline } from './ChemInline'
import { useActiveEditor } from './ActiveEditorContext'
import './RichTextEditor.css'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  multiline?: boolean
}

export function RichTextEditor({ value, onChange, placeholder, multiline = true }: Props) {
  const { setEditor } = useActiveEditor()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, blockquote: false, code: false, codeBlock: false,
        horizontalRule: false, bulletList: false, orderedList: false, listItem: false,
        hardBreak: multiline ? undefined : false,
      }),
      Superscript,
      Subscript,
      Underline,
      MathInline,
      ChemInline,
    ],
    content: value || '',
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    onFocus({ editor }) {
      // Register this editor instance as active so the global toolbar can target it
      setEditor(editor)
    },
    editorProps: {
      handleKeyDown(_view, event) {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      },
    },
  })

  // Sync external value changes (e.g. preset loaded)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  return (
    <div className="rte-wrap">
      <EditorContent
        editor={editor}
        className={`rte-content ${multiline ? 'rte-content--multi' : 'rte-content--single'}`}
        data-placeholder={placeholder}
      />
    </div>
  )
}
