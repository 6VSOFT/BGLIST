import { useRef, useState } from 'react'
import { ImagePlus, Save, Upload } from 'lucide-react'
import ImageGallery from './ImageGallery'
import { makeId } from '../lib/stockStore'

const blank = { nameZh: '', nameEn: '', category: '德式', sku: '', minPlayers: 1, maxPlayers: 4, age: 8, duration: 60, weight: 2.0, totalSets: 1, status: '店内可游玩', location: '', bundles: '', images: [] }
const fields = [['nameZh','名称（中文）'],['nameEn','名称（英文）'],['sku','条形码 / SKU'],['location','货架编号'],['bundles','关联小吃 / 饮料套餐']]
const readImage = file => new Promise((resolve, reject) => {
  const source = new Image()
  const url = URL.createObjectURL(file)
  source.onload = () => {
    const maxEdge = 1600
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale))
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    resolve({ id: makeId(), name: file.name, url: canvas.toDataURL('image/jpeg', 0.8) })
  }
  source.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')) }
  source.src = url
})

export default function ItemForm({ initial, onSave, onCancel }) {
  const [item, setItem] = useState(() => ({ ...blank, ...initial, images: initial?.images || [] })); const [dragging, setDragging] = useState(false); const input = useRef()
  const change = e => setItem(v => ({ ...v, [e.target.name]: e.target.value }))
  const addFiles = async list => { const files = [...list].filter(f => f.type.startsWith('image/')); const images = await Promise.all(files.map(readImage)); setItem(v => ({ ...v, images: [...v.images, ...images] })) }
  const submit = e => { e.preventDefault(); if (!item.nameZh.trim()) return; onSave({ ...item, id: item.id || makeId(), minPlayers: +item.minPlayers, maxPlayers: +item.maxPlayers, age: +item.age, duration: +item.duration, weight: +item.weight, totalSets: +item.totalSets }) }
  return <form onSubmit={submit} className="space-y-6"><section><h3 className="mb-3 text-base font-bold">图片图库</h3><ImageGallery images={item.images} editable onRemove={i => setItem(v => ({...v, images: v.images.filter((_, index) => index !== i)}))}/><div onDragOver={e => {e.preventDefault();setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}} onClick={() => input.current.click()} className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center ${dragging ? 'border-teal-600 bg-teal-50' : 'border-slate-300'}`}><ImagePlus className="mx-auto mb-2 text-teal-700"/><p className="text-sm font-medium">拖放多张图片，或点击选择</p><p className="mt-1 text-xs text-slate-500">新图片会自动压缩至 1600px，减少手机同步流量</p><input ref={input} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} /></div></section><section className="grid gap-4 sm:grid-cols-2">{fields.map(([name,label]) => <div key={name} className={name === 'bundles' ? 'sm:col-span-2' : ''}><label htmlFor={name}>{label}</label><input id={name} name={name} value={item[name]} onChange={change} required={name === 'nameZh'} /></div>)}<div><label>分类</label><select name="category" value={item.category} onChange={change}>{['德式','美式','派对','阵营','合作','儿童'].map(x => <option key={x}>{x}</option>)}</select></div><div><label>租赁状态</label><select name="status" value={item.status} onChange={change}>{['店内可游玩','已借出','维修中'].map(x => <option key={x}>{x}</option>)}</select></div></section><section className="grid grid-cols-2 gap-4 sm:grid-cols-3"><Number name="minPlayers" label="最少人数" value={item.minPlayers} change={change}/><Number name="maxPlayers" label="最多人数" value={item.maxPlayers} change={change}/><Number name="age" label="建议年龄" value={item.age} change={change}/><Number name="duration" label="游戏时长（分钟）" value={item.duration} change={change}/><Number name="weight" label="重度（1.0-5.0）" value={item.weight} step="0.1" min="1" max="5" change={change}/><Number name="totalSets" label="总套数" value={item.totalSets} change={change}/></section><div className="flex justify-end gap-3 border-t pt-5"><button type="button" className="rounded-lg px-4 py-2" onClick={onCancel}>取消</button><button className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white"><Save size={17}/>保存桌游</button></div></form>
}
function Number({name,label,value,change,...props}) { return <div><label htmlFor={name}>{label}</label><input id={name} name={name} type="number" value={value} onChange={change} min="0" {...props}/></div> }
