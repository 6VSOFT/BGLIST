const KEY = 'meeple-pos-stock-v1'
const DB_NAME = 'meeple-pos-offline'
const STORE_NAME = 'inventory'
export const demoGame = { id: 'wingspan', nameZh: '展翅翱翔', nameEn: 'Wingspan', category: '德式', sku: 'BG-WING-001', minPlayers: 1, maxPlayers: 5, age: 10, duration: 70, weight: 2.4, totalSets: 3, status: '店内可游玩', location: 'A-03', bundles: '观鸟下午茶', images: [] }
export const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

function normalizeImage(image) {
  if (typeof image === 'string') return { id: makeId(), name: '桌游图片', url: image }
  return image?.url ? { id: image.id || makeId(), name: image.name || '桌游图片', url: image.url } : null
}
function normalizeGame(game) {
  if (!game || typeof game !== 'object') return null
  return { ...demoGame, ...game, id: game.id || makeId(), images: Array.isArray(game.images) ? game.images.map(normalizeImage).filter(Boolean) : [] }
}
export function getGames() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(parsed) ? parsed.map(normalizeGame).filter(Boolean) : [demoGame]
  } catch { return [demoGame] }
}
export function saveGames(games) {
  try { localStorage.setItem(KEY, JSON.stringify(games)) }
  catch (error) { console.error('无法储存桌游资料：图片可能过大。', error) }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readPersistedGames() {
  try {
    const db = await openDatabase()
    const saved = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    if (Array.isArray(saved)) return saved.map(normalizeGame).filter(Boolean)
  } catch (error) { console.warn('IndexedDB 读取失败，将使用旧版本地资料。', error) }
  return getGames()
}

export async function persistGames(games) {
  saveGames(games) // 保留旧版缓存，确保已存在资料升级后仍可恢复。
  try {
    const db = await openDatabase()
    await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(games, KEY)
      request.onsuccess = resolve
      request.onerror = () => reject(request.error)
    })
    db.close()
    return true
  } catch (error) { console.error('无法保存离线桌游资料。', error); return false }
}
