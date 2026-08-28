import { supabase, supabaseEnabled } from './supabase'

const toRow = game => ({ id: game.id, name_zh: game.nameZh, name_en: game.nameEn || '', category: game.category, sku: game.sku || '', min_players: game.minPlayers, max_players: game.maxPlayers, age: game.age, duration: game.duration, weight: game.weight, total_sets: game.totalSets, status: game.status, location: game.location || '', bundles: game.bundles || '', images: game.images || [] })
const toGame = row => ({ id: row.id, nameZh: row.name_zh, nameEn: row.name_en, category: row.category, sku: row.sku, minPlayers: row.min_players, maxPlayers: row.max_players, age: row.age, duration: row.duration, weight: Number(row.weight), totalSets: row.total_sets, status: row.status, location: row.location, bundles: row.bundles, images: row.images || [] })

export async function ensureSupabaseSession() {
  if (!supabaseEnabled) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}
export async function loadCloudGames() { if (!supabaseEnabled) return null; const { data, error } = await supabase.from('board_games').select('*').order('updated_at', { ascending: false }); if (error) throw error; return data.map(toGame) }
export async function saveCloudGame(game) { if (!supabaseEnabled) return false; const { error } = await supabase.from('board_games').upsert(toRow(game), { onConflict: 'id' }); if (error) throw error; return true }
export async function saveCloudGames(games) { if (!supabaseEnabled || !games.length) return false; const { error } = await supabase.from('board_games').upsert(games.map(toRow), { onConflict: 'id' }); if (error) throw error; return true }
export function subscribeToCloudGames(onChange) { return supabaseEnabled ? supabase.channel('board-games-inventory').on('postgres_changes', { event: '*', schema: 'public', table: 'board_games' }, onChange).subscribe() : null }
