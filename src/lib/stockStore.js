const KEY = 'meeple-pos-stock-v1'
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
