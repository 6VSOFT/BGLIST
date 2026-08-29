import { supabase, supabaseEnabled } from './supabase'

const toNote = row => ({ id: row.id, title: row.title, gameDate: row.game_date || '', variant: row.variant || '', round: row.round || '', content: row.content || '', updatedAt: row.updated_at })
const toRow = note => ({ id: note.id, title: note.title || '未命名对局', game_date: note.gameDate || null, variant: note.variant || '', round: note.round || '', content: typeof note.content === 'string' ? note.content : JSON.stringify(note.content || {}) })

export async function loadJudgeNotes() {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase.from('wolf_judge_notes').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(toNote)
}

export async function saveJudgeNote(note) {
  if (!supabaseEnabled) throw new Error('尚未配置云端同步')
  const { error } = await supabase.from('wolf_judge_notes').upsert(toRow(note), { onConflict: 'id' })
  if (error) throw error
}
