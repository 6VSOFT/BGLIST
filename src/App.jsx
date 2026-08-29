import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardPenLine, Cloud, CloudOff, Gamepad2, LogOut, Pencil, Plus, RefreshCw, Search, Users } from 'lucide-react'
import ItemForm from './components/ItemForm'
import ImageGallery from './components/ImageGallery'
import JudgeTool from './components/JudgeTool'
import StaffAccess from './components/StaffAccess'
import { getGames, persistGames, readPersistedGames } from './lib/stockStore'
import { supabase, supabaseEnabled } from './lib/supabase'
import { ensureSupabaseSession, loadCloudGameImages, loadCloudGames, saveCloudGame, saveCloudGames, signInStaff, signOutStaff, signUpStaff, subscribeToCloudGames, unsubscribeFromCloudGames } from './lib/supabaseStore'

export default function App() {
  const [games, setGames] = useState(getGames)
  const [editing, setEditing] = useState(null)
  const [judgeOpen, setJudgeOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [session, setSession] = useState(null)
  const [syncStatus, setSyncStatus] = useState(supabaseEnabled ? '请登录以同步库存。' : '尚未配置云端同步，资料只保存在本机。')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const gamesRef = useRef(games)
  const syncingRef = useRef(false)
  const loadingImagesRef = useRef(new Set())

  useEffect(() => {
    let active = true
    readPersistedGames().then(saved => { if (active) { setGames(saved); setHydrated(true) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (hydrated) persistGames(games).then(ok => { if (!ok) setSaveError('储存空间不足，请减少图片数量或大小后重试。') })
  }, [games, hydrated])

  useEffect(() => { gamesRef.current = games }, [games])

  const hydrateCloudImages = useCallback(async cloudGames => {
    for (const game of cloudGames) {
      if (loadingImagesRef.current.has(game.id)) continue
      loadingImagesRef.current.add(game.id)
      try {
        const images = await loadCloudGameImages(game.id)
        setGames(current => current.map(item => item.id === game.id ? { ...item, images } : item))
      } catch (error) {
        console.warn(`图片加载失败（${game.nameZh}），库存资料仍可使用。`, error)
      } finally { loadingImagesRef.current.delete(game.id) }
    }
  }, [])

  useEffect(() => {
    if (!supabaseEnabled) return undefined
    let active = true
    ensureSupabaseSession().then(current => { if (active) setSession(current) }).catch(error => { if (active) setAuthError(error.message) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => { if (active) setSession(current) })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const syncFromCloud = useCallback(async () => {
    if (!session || syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const remoteGames = await loadCloudGames()
      if (remoteGames.length) {
        const cachedImages = new Map(gamesRef.current.map(game => [game.id, game.images]))
        const gamesWithCachedImages = remoteGames.map(game => ({ ...game, images: cachedImages.get(game.id) || [] }))
        setGames(gamesWithCachedImages)
        hydrateCloudImages(gamesWithCachedImages)
      }
      else if (gamesRef.current.length) await saveCloudGames(gamesRef.current)
      setSyncStatus('云端已同步 · 所有登录设备会自动更新')
    } catch (error) {
      setSyncStatus(`云端同步失败：${error.message}`)
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [hydrateCloudImages, session])

  useEffect(() => {
    if (!hydrated || !session) return undefined
    let channel
    const onVisible = () => { if (document.visibilityState === 'visible') syncFromCloud() }
    syncFromCloud().then(() => {
      channel = subscribeToCloudGames(syncFromCloud, status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('实时连接失败，已改为在联网或回到页面时自动重试。')
      })
    })
    window.addEventListener('online', syncFromCloud)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', syncFromCloud)
      document.removeEventListener('visibilitychange', onVisible)
      unsubscribeFromCloudGames(channel)
    }
  }, [hydrated, session, syncFromCloud])

  const shown = games.filter(g => `${g.nameZh} ${g.nameEn} ${g.sku}`.toLowerCase().includes(query.toLowerCase()))
  const save = async game => {
    setSaveError('')
    setGames(list => list.some(g => g.id === game.id) ? list.map(g => g.id === game.id ? game : g) : [game, ...list])
    setEditing(null)
    if (!session) return
    try {
      await saveCloudGame(game)
      setSyncStatus('云端已同步 · 所有登录设备会自动更新')
    } catch (error) { setSyncStatus(`本机已保存，但云端同步失败：${error.message}`) }
  }
  const authenticate = async (email, password, mode) => {
    setAuthBusy(true); setAuthError('')
    try {
      if (mode === 'signup') {
        const result = await signUpStaff(email, password)
        if (result.session) setSession(result.session)
        else setAuthError('账号已创建，请先到邮箱完成验证，再登录。')
      } else {
        const nextSession = await signInStaff(email, password)
        setSession(nextSession)
      }
    } catch (error) { setAuthError(error.message) } finally { setAuthBusy(false) }
  }
  const signOut = async () => { try { await signOutStaff(); setSession(null); setSyncStatus('已退出云端同步。') } catch (error) { setAuthError(error.message) } }

  return <main className={`mx-auto p-4 sm:p-7 ${judgeOpen ? 'max-w-[1600px]' : 'max-w-6xl'}`}><header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-700 p-3 text-white"><Gamepad2 /></div><div><h1 className="text-xl font-bold">Meeple POS</h1><p className="text-sm text-slate-500">桌游库存维护</p></div></div><div className="flex items-center gap-2"><button onClick={() => { setEditing(null); setJudgeOpen(true) }} className="inline-flex items-center gap-2 rounded-xl border border-teal-700 px-4 py-2.5 font-medium text-teal-800"><ClipboardPenLine size={18}/>法官工具</button>{session && <><button onClick={syncFromCloud} disabled={syncing} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-60"><RefreshCw className={syncing ? 'animate-spin' : ''} size={16}/>同步</button><button onClick={signOut} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm"><LogOut size={16}/>退出</button></>}<button onClick={() => { setJudgeOpen(false); setEditing({}) }} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-medium text-white shadow-sm"><Plus size={18}/>新增桌游</button></div></header>
    {supabaseEnabled && !session && <StaffAccess busy={authBusy} error={authError} onSignIn={(email, password) => authenticate(email, password, 'signin')} onSignUp={(email, password) => authenticate(email, password, 'signup')} />}
    <p className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${session ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'}`}>{session ? <Cloud size={16}/> : <CloudOff size={16}/>}{syncStatus}</p>
    {saveError && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{saveError}</p>}
    {judgeOpen ? <JudgeTool session={session} onClose={() => setJudgeOpen(false)} /> : editing !== null ? <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="mb-6 text-lg font-bold">{editing.id ? '编辑桌游' : '新增桌游'}</h2><ItemForm initial={editing} onSave={save} onCancel={() => setEditing(null)} /></section> : <><div className="relative mb-5"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input className="pl-10" placeholder="搜索名称或 SKU" value={query} onChange={e => setQuery(e.target.value)}/></div><section className="grid gap-4 md:grid-cols-2">{shown.map(game => <article key={game.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="p-4"><ImageGallery images={game.images}/></div><div className="space-y-3 border-t p-5"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{game.nameZh}</h2><p className="text-sm text-slate-500">{game.nameEn || '—'} · {game.category}</p></div><button onClick={() => setEditing(game)} className="h-9 rounded-lg border px-3 text-sm"><Pencil className="mr-1 inline" size={15}/>编辑</button></div><div className="grid grid-cols-2 gap-2 text-sm text-slate-600"><span><Users className="mr-1 inline" size={15}/>{game.minPlayers}–{game.maxPlayers} 人</span><span>{game.duration} 分钟 · 重度 {game.weight}</span><span>库存 {game.totalSets} 套</span><span>位置 {game.location || '未设置'}</span></div><div className="flex items-center justify-between"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">{game.status}</span><span className="text-xs text-slate-400">{game.sku || '无 SKU'}</span></div></div></article>)}</section>{!shown.length && <p className="py-16 text-center text-slate-500">未找到桌游</p>}</>}</main>
}
