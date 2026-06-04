import { useState } from 'react'
import type { Worksheet, HeaderBlock } from '../types/worksheet'
import { computeTotalMarks } from '../utils/marks'

export interface GalleryEntry {
  id: string
  title: string
  topic: string
  examBoard: string
  tier: string
  blockCount: number
  questionCount: number
  totalMarks: number
  savedAt: string
  worksheet: Worksheet
}

const STORAGE_KEY = 'worksheet-builder-gallery'

function getTitle(worksheet: Worksheet): { title: string; topic: string; examBoard: string; tier: string } {
  const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined
  return {
    title: header?.title || 'Untitled',
    topic: header?.topic || '',
    examBoard: header?.examBoard || '',
    tier: header?.tier || '',
  }
}

function load(): GalleryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GalleryEntry[]) : []
  } catch {
    return []
  }
}

function persist(entries: GalleryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useSavedWorksheets() {
  const [entries, setEntries] = useState<GalleryEntry[]>(load)

  function save(worksheet: Worksheet) {
    const meta = getTitle(worksheet)
    const questionTypes = new Set(['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'])
    const entry: GalleryEntry = {
      id: worksheet.id,
      ...meta,
      blockCount: worksheet.blocks.length,
      questionCount: worksheet.blocks.filter(b => questionTypes.has(b.type)).length,
      totalMarks: computeTotalMarks(worksheet.blocks),
      savedAt: new Date().toISOString(),
      worksheet,
    }
    setEntries(prev => {
      const next = [entry, ...prev.filter(e => e.id !== entry.id)]
      persist(next)
      return next
    })
  }

  function remove(id: string) {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id)
      persist(next)
      return next
    })
  }

  return { entries, save, remove }
}
