import { useReducer, useEffect } from 'react'
import type { Block, Worksheet } from '../types/worksheet'

export type WorksheetAction =
  | { type: 'ADD_BLOCK'; block: Block; afterId?: string }
  | { type: 'UPDATE_BLOCK'; id: string; updates: Partial<Block> }
  | { type: 'DELETE_BLOCK'; id: string }
  | { type: 'MOVE_BLOCK'; id: string; direction: 'up' | 'down' }
  | { type: 'LOAD_PRESET'; worksheet: Worksheet }
  | { type: 'LOAD_WORKSHEET'; worksheet: Worksheet }
  | { type: 'TOGGLE_LINES' }

function reducer(state: Worksheet, action: WorksheetAction): Worksheet {
  switch (action.type) {
    case 'ADD_BLOCK': {
      if (!action.afterId) {
        return { ...state, blocks: [...state.blocks, action.block] }
      }
      const idx = state.blocks.findIndex(b => b.id === action.afterId)
      const blocks = [...state.blocks]
      blocks.splice(idx + 1, 0, action.block)
      return { ...state, blocks }
    }
    case 'UPDATE_BLOCK': {
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === action.id ? ({ ...b, ...action.updates } as Block) : b
        ),
      }
    }
    case 'DELETE_BLOCK': {
      return { ...state, blocks: state.blocks.filter(b => b.id !== action.id) }
    }
    case 'MOVE_BLOCK': {
      const idx = state.blocks.findIndex(b => b.id === action.id)
      const newIdx = action.direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= state.blocks.length) return state
      const blocks = [...state.blocks]
      ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
      return { ...state, blocks }
    }
    case 'LOAD_PRESET':
      return { ...action.worksheet, id: crypto.randomUUID() }
    case 'LOAD_WORKSHEET':
      return action.worksheet
    case 'TOGGLE_LINES':
      return { ...state, showLines: state.showLines === false ? true : false }
  }
}

const STORAGE_KEY = 'worksheet-builder-draft'

const INITIAL_WORKSHEET: Worksheet = {
  id: crypto.randomUUID(),
  blocks: [
    {
      id: crypto.randomUUID(),
      type: 'header',
      title: 'Electromagnetic Waves',
      topic: 'Physics — Waves',
      examBoard: 'AQA',
      tier: 'higher',
      showName: true,
      showDate: true,
      showClass: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'instructions',
      items: [
        'Answer all questions.',
        'Write your answers in the spaces provided.',
        'The marks for each question are shown in brackets.',
      ],
    },
  ],
}

function loadInitial(): Worksheet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Worksheet
      if (parsed.id && Array.isArray(parsed.blocks)) return parsed
    }
  } catch {}
  return INITIAL_WORKSHEET
}

export function useWorksheet() {
  const [worksheet, dispatch] = useReducer(reducer, undefined, loadInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worksheet))
  }, [worksheet])

  return { worksheet, dispatch }
}
