import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { MCQuiz, MCQuestion, QuizScan } from '../types/mcQuiz'

export function useMCQuiz(profileId: string | null) {
  const [quizzes, setQuizzes] = useState<MCQuiz[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!profileId || !isConfigured) return
    setLoading(true)
    const { data } = await supabase
      .from('mc_quizzes')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    if (data) setQuizzes(data as MCQuiz[])
    setLoading(false)
  }, [profileId])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function fetchById(id: string): Promise<MCQuiz | null> {
    if (!isConfigured) return null
    const { data } = await supabase.from('mc_quizzes').select('*').eq('id', id).maybeSingle()
    return data as MCQuiz | null
  }

  async function save(
    worksheetId: string,
    title: string,
    questions: MCQuestion[],
    questionCount: number,
    versionCount: number,
  ): Promise<MCQuiz | null> {
    if (!profileId || !isConfigured) return null
    const row = {
      profile_id: profileId,
      worksheet_id: worksheetId,
      title,
      question_count: questionCount,
      version_count: versionCount,
      questions,
    }
    const { data } = await supabase.from('mc_quizzes').insert(row).select().maybeSingle()
    if (data) {
      const quiz = data as MCQuiz
      setQuizzes(prev => [quiz, ...prev])
      return quiz
    }
    return null
  }

  async function saveFollowUp(
    title: string,
    questions: MCQuestion[],
    questionCount: number,
    versionCount: number,
    sourceFile: { path: string; name: string; type: string },
  ): Promise<MCQuiz | null> {
    if (!profileId || !isConfigured) return null
    const row = {
      profile_id: profileId,
      worksheet_id: null,
      title,
      question_count: questionCount,
      version_count: versionCount,
      questions,
      source_type: 'document' as const,
      source_file_path: sourceFile.path,
      source_file_name: sourceFile.name,
      source_file_type: sourceFile.type,
    }
    const { data } = await supabase.from('mc_quizzes').insert(row).select().maybeSingle()
    if (data) {
      const quiz = data as MCQuiz
      setQuizzes(prev => [quiz, ...prev])
      return quiz
    }
    return null
  }

  async function fetchFollowUps(): Promise<MCQuiz[]> {
    if (!profileId || !isConfigured) return []
    const { data } = await supabase
      .from('mc_quizzes')
      .select('*')
      .eq('profile_id', profileId)
      .eq('source_type', 'document')
      .order('created_at', { ascending: false })
    return (data ?? []) as MCQuiz[]
  }

  async function remove(id: string) {
    if (!isConfigured) return
    await supabase.from('mc_quizzes').delete().eq('id', id)
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  function getByWorksheetId(worksheetId: string): MCQuiz | undefined {
    return quizzes.find(q => q.worksheet_id === worksheetId)
  }

  async function fetchScans(quizId: string): Promise<QuizScan[]> {
    if (!isConfigured) return []
    const { data } = await supabase
      .from('quiz_scans')
      .select('*')
      .eq('quiz_id', quizId)
      .order('scanned_at', { ascending: false })
    return (data ?? []) as QuizScan[]
  }

  async function saveScan(scan: Omit<QuizScan, 'id' | 'scanned_at'>): Promise<QuizScan | null> {
    if (!isConfigured) return null
    const { data } = await supabase.from('quiz_scans').insert(scan).select().maybeSingle()
    return data as QuizScan | null
  }

  return { quizzes, loading, fetchById, save, saveFollowUp, fetchFollowUps, remove, getByWorksheetId, fetchScans, saveScan }
}
