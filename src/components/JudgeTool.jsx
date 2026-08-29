import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FilePlus2, Save } from 'lucide-react'
import { makeId } from '../lib/stockStore'
import { loadJudgeNotes, saveJudgeNote } from '../lib/judgeNotesStore'

const rounds = ['第一夜/日', '第二夜/日', '第三夜/日', '第四夜/日', '第五夜/日', '第六夜/日', '第七夜/日']
const nightRows = [['狼人', '出局号码：\n击杀对象：'], ['狼神（ ）', '技能对象：'], ['神职（ ）', '技能对象：'], ['神职（ ）', '技能对象：'], ['神职（ ）', '技能对象：'], ['女巫', '解救对象：\n毒杀对象：'], ['预言家', '查验对象：\n结果：[ ] 好人  [ ] 狼人']]
const dayRows = [['狼神（ ）', '技能对象：'], ['神职（ ）', '技能对象：'], ['警徽流向', '新任警长：']]

const createBoard = () => ({
  version: 2,
  camps: { divine: Array(5).fill(null).map(() => ({ role: '', number: '' })), wolves: Array(3).fill(null).map(() => ({ role: '', number: '' })), villagers: Array(2).fill(null).map(() => ({ role: '', number: '' })), third: [{ role: '', number: '' }] },
  eliminated: Array(7).fill(''),
  night: Object.fromEntries(nightRows.map(([label]) => [label, Array(7).fill('')])),
  day: Object.fromEntries(dayRows.map(([label]) => [label, Array(7).fill('')])),
  winners: { good: false, wolves: false, third: false },
  mvp: '', svp: ''
})

const parseBoard = content => {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.version === 2) {
      const base = createBoard()
      const fillCamp = (camp, length) => [...(parsed.camps?.[camp] || []), ...base.camps[camp]].slice(0, length)
      return { ...base, ...parsed, camps: { ...base.camps, ...parsed.camps, divine: fillCamp('divine', 5), wolves: fillCamp('wolves', 3), villagers: fillCamp('villagers', 2), third: fillCamp('third', 1) }, night: { ...base.night, ...parsed.night }, day: { ...base.day, ...parsed.day }, winners: { ...base.winners, ...parsed.winners } }
    }
  } catch { /* 旧版文字笔记保留在历史记录中，不影响新表格。 */ }
  return createBoard()
}

const freshNote = () => ({ id: makeId(), title: '狼人杀法官笔记', gameDate: new Date().toISOString().slice(0, 10), variant: '', round: '第 1 局', content: JSON.stringify(createBoard()) })
const Cell = ({ value, placeholder, onChange }) => <textarea className="min-h-20 min-w-32 resize-y border-0 bg-transparent p-2 text-sm focus:ring-2 focus:ring-teal-500" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />

export default function JudgeTool({ session, onClose }) {
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState(freshNote)
  const [status, setStatus] = useState('正在读取笔记…')
  const pending = useRef()
  const board = parseBoard(note.content)

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
    try { setStatus('正在保存…'); await saveJudgeNote(next); setNotes(list => [next, ...list.filter(item => item.id !== next.id)]); setStatus('已永久保存到云端') }
    catch (error) { setStatus(`保存失败：${error.message}`) }
  }
  const update = patch => {
    const next = { ...note, ...patch }
    setNote(next); clearTimeout(pending.current); pending.current = setTimeout(() => persist(next), 700)
  }
  const updateBoard = transform => update({ content: JSON.stringify(transform(board)) })
  const updateRound = (phase, label, index, value) => updateBoard(current => ({ ...current, [phase]: { ...current[phase], [label]: current[phase][label].map((cell, cellIndex) => cellIndex === index ? value : cell) } }))
  const create = () => { clearTimeout(pending.current); const next = freshNote(); setNote(next); setStatus('新笔记：输入后自动保存') }
  const updateCamp = (camp, index, field, value) => updateBoard(current => ({ ...current, camps: { ...current.camps, [camp]: current.camps[camp].map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry) } }))

  return <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-7"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><button onClick={onClose} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft size={16}/>返回库存</button><h2 className="text-xl font-bold">🐺 狼人杀 · 法官笔记 📑</h2><p className="mt-1 text-sm text-slate-500">{status}</p></div><div className="flex gap-2"><button onClick={create} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><FilePlus2 size={16}/>新对局</button><button onClick={() => persist(note)} disabled={!session} className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"><Save size={16}/>保存</button></div></div>
    <div className="grid gap-4 xl:grid-cols-[14rem_minmax(0,1fr)]"><aside className="max-h-96 overflow-auto rounded-xl bg-slate-50 p-3"><p className="mb-2 text-sm font-semibold text-slate-600">历史对局</p>{notes.map(item => <button key={item.id} onClick={() => setNote(item)} className={`mb-2 w-full rounded-lg p-3 text-left text-sm ${item.id === note.id ? 'bg-teal-700 text-white' : 'bg-white hover:bg-teal-50'}`}><strong className="block truncate">{item.title}</strong><span className="text-xs opacity-75">{item.gameDate || '未设日期'} · {item.variant || '未设板型'}</span></button>)}{!notes.length && <p className="p-3 text-sm text-slate-500">尚无已保存对局</p>}</aside>
      <div className="overflow-x-auto"><div className="min-w-[1120px] space-y-4"><div className="grid grid-cols-3 gap-4"><div><label>日期</label><input type="date" value={note.gameDate} onChange={event => update({ gameDate: event.target.value })}/></div><div><label>版型</label><input value={note.variant} onChange={event => update({ variant: event.target.value })} placeholder="例如：预女猎白"/></div><div><label>局次</label><input value={note.round} onChange={event => update({ round: event.target.value })} placeholder="第 1 局"/></div></div><div><label>对局名称</label><input value={note.title} onChange={event => update({ title: event.target.value })}/></div>
        <table className="w-full table-fixed border-collapse text-center text-sm"><colgroup><col span="11"/><col className="w-44"/></colgroup><thead><tr className="bg-slate-700 text-white"><th className="border border-slate-500 p-2" colSpan="5">神职</th><th className="border border-slate-500 p-2" colSpan="3">狼人</th><th className="border border-slate-500 p-2" colSpan="2">平民</th><th className="border border-slate-500 p-2">第三方</th><th className="border border-slate-500 p-2" rowSpan="3">每轮出局序号</th></tr></thead><tbody><tr>{['divine','wolves','villagers','third'].flatMap(camp => board.camps[camp].map((entry, index) => <td key={`${camp}-${index}`} className="h-28 border border-slate-200 p-0"><input className="h-full w-full border-0 bg-transparent px-2 text-center text-base placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-500" value={entry.role} onChange={event => updateCamp(camp, index, 'role', event.target.value)} placeholder="身份"/></td>))}<td className="border p-1" rowSpan="2">{board.eliminated.map((value, index) => <div key={index} className="flex items-center border-b last:border-0"><span className="w-14 text-xs font-semibold">DAY {index + 1}</span><input className="border-0 p-1" value={value} onChange={event => updateBoard(current => ({ ...current, eliminated: current.eliminated.map((cell, cellIndex) => cellIndex === index ? event.target.value : cell) }))} placeholder="号码"/></div>)}</td></tr><tr>{['divine','wolves','villagers','third'].flatMap(camp => board.camps[camp].map((entry, index) => <td key={`${camp}-${index}`} className="h-28 border border-slate-200 p-0"><input className="h-full w-full border-0 bg-transparent px-2 text-center text-base placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-500" value={entry.number} onChange={event => updateCamp(camp, index, 'number', event.target.value)} placeholder="号码"/></td>))}</tr></tbody></table>
        <RoundTable title="🌙 夜 晚 阶 段" rows={nightRows} phase="night" board={board} onChange={updateRound}/><RoundTable title="☀️ 白 天 阶 段" rows={dayRows} phase="day" board={board} onChange={updateRound}/>
        <div className="grid grid-cols-[1fr_18rem] gap-4"><div></div><div className="rounded-lg border p-4"><h3 className="mb-3 bg-slate-700 p-2 text-center font-bold text-white">获胜方</h3>{[['good','好人阵营'],['wolves','狼人阵营'],['third','第三方']].map(([key,label]) => <label key={key} className="mb-2 flex items-center gap-2"><input type="checkbox" checked={board.winners[key]} onChange={event => updateBoard(current => ({ ...current, winners: { ...current.winners, [key]: event.target.checked } }))}/>{label}</label>)}<h3 className="mb-3 mt-5 bg-slate-700 p-2 text-center font-bold text-white">个人结算</h3><label>MVP<input value={board.mvp} onChange={event => updateBoard(current => ({ ...current, mvp: event.target.value }))}/></label><label>SVP<input value={board.svp} onChange={event => updateBoard(current => ({ ...current, svp: event.target.value }))}/></label></div></div>
      </div></div></div>
  </section>
}

function RoundTable({ title, rows, phase, board, onChange }) {
  return <table className="mt-4 w-full border-collapse text-sm"><thead><tr className="bg-slate-700 text-white"><th className="border border-slate-500 p-2">行动/环节</th>{rounds.map(round => <th key={round} className="border border-slate-500 p-2">{round}</th>)}</tr></thead><tbody><tr><th colSpan="8" className="border bg-slate-100 p-2 text-base">{title}</th></tr>{rows.map(([label, placeholder]) => <tr key={label}><th className="w-28 border bg-slate-50 p-2">{label}</th>{rounds.map((_, index) => <td key={index} className="border align-top"><Cell value={board[phase][label][index]} placeholder={placeholder} onChange={value => onChange(phase, label, index, value)}/></td>)}</tr>)}</tbody></table>
}
