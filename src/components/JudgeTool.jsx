import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FilePlus2, Save } from 'lucide-react'
import { makeId } from '../lib/stockStore'
import { loadJudgeNotes, saveJudgeNote } from '../lib/judgeNotesStore'

const freshNote = () => ({ id: makeId(), title: '狼人杀法官笔记', gameDate: new Date().toISOString().slice(0, 10), variant: '', round: '', content: '' })

export default function JudgeTool({ session, onClose }) {
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState(freshNote)
  const [status, setStatus] = useState('正在读取笔记…')
  const pending = useRef()

  useEffect(() => {
    if (!session) { setStatus('请先登录员工账号，法官笔记才会永久保存。'); return undefined }
    let active = true
    loadJudgeNotes().then(saved => {
      if (!active) return
      setNotes(saved)
      if (saved[0]) setNote(saved[0])
      setStatus(saved.length ? '云端笔记已载入' : '新建第一份法官笔记后会自动永久保存')
    }).catch(error => active && setStatus(`读取失败：${error.message}`))
    return () => { active = false; clearTimeout(pending.current) }
  }, [session])

  const persist = async next => {
    if (!session) return
    try {
      setStatus('正在保存…')
      await saveJudgeNote(next)
      setNotes(list => [next, ...list.filter(item => item.id !== next.id)])
      setStatus('已永久保存到云端')
    } catch (error) { setStatus(`保存失败：${error.message}`) }
  }
  const update = patch => {
    const next = { ...note, ...patch }
    setNote(next)
    clearTimeout(pending.current)
    pending.current = setTimeout(() => persist(next), 700)
  }
  const create = () => { clearTimeout(pending.current); const next = freshNote(); setNote(next); setStatus('新笔记：输入后自动保存') }

  return <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><button onClick={onClose} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft size={16}/>返回库存</button><h2 className="text-xl font-bold">🐺 狼人杀 · 法官笔记</h2><p className="mt-1 text-sm text-slate-500">{status}</p></div><div className="flex gap-2"><button onClick={create} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><FilePlus2 size={16}/>新对局</button><button onClick={() => persist(note)} disabled={!session} className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"><Save size={16}/>保存</button></div></div>
    <div className="grid gap-4 md:grid-cols-[13rem_1fr]"><aside className="max-h-96 overflow-auto rounded-xl bg-slate-50 p-3"><p className="mb-2 text-sm font-semibold text-slate-600">历史对局</p>{notes.map(item => <button key={item.id} onClick={() => setNote(item)} className={`mb-2 w-full rounded-lg p-3 text-left text-sm ${item.id === note.id ? 'bg-teal-700 text-white' : 'bg-white hover:bg-teal-50'}`}><strong className="block truncate">{item.title}</strong><span className="text-xs opacity-75">{item.gameDate || '未设日期'} · {item.variant || '未设板型'}</span></button>)}{!notes.length && <p className="p-3 text-sm text-slate-500">尚无已保存对局</p>}</aside>
      <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><div><label>对局名称</label><input value={note.title} onChange={event => update({ title: event.target.value })} placeholder="例如：周末狼人杀"/></div><div><label>日期</label><input type="date" value={note.gameDate} onChange={event => update({ gameDate: event.target.value })}/></div><div><label>板型 / 局次</label><input value={note.variant} onChange={event => update({ variant: event.target.value })} placeholder="例如：预女猎白"/></div></div><div><label>当前轮次</label><input value={note.round} onChange={event => update({ round: event.target.value })} placeholder="例如：第 2 夜 / DAY 2"/></div><div><label>法官记录</label><textarea className="min-h-96" value={note.content} onChange={event => update({ content: event.target.value })} placeholder={'可记录：\n【身份】1号预言家、2号狼人…\n【第一夜】狼人击杀 5 号；女巫救人…\n【DAY 1】发言、投票、遗言…\n【胜负】好人阵营胜利；MVP：…'} /></div></div></div>
  </section>
}
