import { supabase, supabaseEnabled } from './supabase'

const IMAGE_BUCKET = 'board-game-images'
const isDataUrl = value => typeof value === 'string' && value.startsWith('data:image/')

function publicImageUrl(path) {
  return path ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : ''
}

async function compressForCloud(file, maxEdge, quality) {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const source = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('图片无法压缩，请重新选择该图片。'))
      image.src = sourceUrl
    })
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale))
    canvas.height = Math.max(1, Math.round(source.height * scale))
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
    const result = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!result) throw new Error('图片压缩失败，请重新选择该图片。')
    return result
  } finally { URL.revokeObjectURL(sourceUrl) }
}

async function storeImage(gameId, image) {
  if (image?.path) return { id: image.id, name: image.name || '桌游图片', path: image.path }
  if (!isDataUrl(image?.url)) return { id: image.id, name: image.name || '桌游图片', url: image.url || '' }
  const response = await fetch(image.url)
  const original = await response.blob()
  // Old local caches may contain 1600px Base64 images. Recompress before upload so each object stays below the bucket limit.
  let file = await compressForCloud(original, 1200, 0.7)
  if (file.size > 4_500_000) file = await compressForCloud(original, 960, 0.58)
  if (file.size > 4_500_000) throw new Error('图片压缩后仍超过 5 MB，请换一张较小的图片。')
  const path = `games/${gameId}/${image.id || crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true })
  if (error) throw error
  return { id: image.id, name: image.name || '桌游图片', path }
}

async function toRow(game) {
  const images = await Promise.all((game.images || []).map(image => storeImage(game.id, image)))
  return { id: game.id, name_zh: game.nameZh, name_en: game.nameEn || '', category: game.category, sku: game.sku || '', min_players: game.minPlayers, max_players: game.maxPlayers, age: game.age, duration: game.duration, weight: game.weight, total_sets: game.totalSets, status: game.status, location: game.location || '', bundles: game.bundles || '', images }
}
const toGame = row => ({ id: row.id, nameZh: row.name_zh, nameEn: row.name_en, category: row.category, sku: row.sku, minPlayers: row.min_players, maxPlayers: row.max_players, age: row.age, duration: row.duration, weight: Number(row.weight), totalSets: row.total_sets, status: row.status, location: row.location, bundles: row.bundles, images: row.images || [] })
const gameFields = 'id,name_zh,name_en,category,sku,min_players,max_players,age,duration,weight,total_sets,status,location,bundles,created_at,updated_at'

export async function ensureSupabaseSession() {
  if (!supabaseEnabled) return null
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function signInStaff(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signUpStaff(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOutStaff() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
// 图片可能是大尺寸 Data URL。列表同步刻意不读取 images，避免移动网络因数十 MB 的 JSON 查询超时。
export async function loadCloudGames() { if (!supabaseEnabled) return null; const { data, error } = await supabase.from('board_games').select(gameFields).order('updated_at', { ascending: false }); if (error) throw error; return data.map(toGame) }
export async function loadCloudGameImages(id) {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase.from('board_games').select('images').eq('id', id).single()
  if (error) throw error
  return Array.isArray(data.images) ? data.images.map(image => image?.path ? { ...image, url: publicImageUrl(image.path) } : image).filter(image => image?.url) : []
}
export async function saveCloudGame(game) { if (!supabaseEnabled) return false; const { error } = await supabase.from('board_games').upsert(await toRow(game), { onConflict: 'id' }); if (error) throw error; return true }
export async function saveCloudGames(games) {
  if (!supabaseEnabled || !games.length) return false
  // One game at a time prevents a large local image collection becoming one oversized SQL request.
  for (const game of games) await saveCloudGame(game)
  return true
}
export function subscribeToCloudGames(onChange, onStatus) {
  if (!supabaseEnabled) return null
  const channel = supabase.channel(`board-games-inventory-${crypto.randomUUID?.() || Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'board_games' }, onChange)
    .subscribe(onStatus)
  return channel
}

export function unsubscribeFromCloudGames(channel) {
  return channel ? supabase.removeChannel(channel) : Promise.resolve()
}
