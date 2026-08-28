import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'

export default function ImageGallery({ images = [], editable = false, onRemove }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const swipeStartX = useRef(null)

  useEffect(() => {
    if (active >= images.length) setActive(Math.max(0, images.length - 1))
  }, [images.length, active])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = event => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowLeft') setActive(index => (index - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setActive(index => (index + 1) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, images.length])

  if (!images.length) return <div className="grid h-52 place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400"><div className="text-center"><ImageOff className="mx-auto mb-2" /><span className="text-sm">尚未上传图片</span></div></div>

  const previous = () => setActive(index => (index - 1 + images.length) % images.length)
  const next = () => setActive(index => (index + 1) % images.length)
  const onPointerDown = event => { swipeStartX.current = event.clientX }
  const onPointerUp = event => {
    const distance = event.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(distance) < 45 || images.length < 2) return
    if (distance < 0) next()
    else previous()
  }

  return <>
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-900">
        <img src={images[active].url} alt={images[active].name || '桌游图片'} className="h-64 w-full object-contain sm:h-80" />
        <button type="button" onClick={() => setOpen(true)} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white" aria-label="放大图片"><Expand size={18}/></button>
        {images.length > 1 && <><button type="button" onClick={previous} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"><ChevronLeft /></button><button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"><ChevronRight /></button></>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">{images.map((image, i) => <div className="relative shrink-0" key={image.id}><button type="button" onClick={() => setActive(i)} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === active ? 'border-teal-600' : 'border-transparent'}`}><img src={image.url} alt="缩略图" className="h-full w-full object-cover" /></button>{editable && <button type="button" onClick={() => onRemove(i)} className="absolute -right-1 -top-1 rounded-full bg-rose-600 p-0.5 text-white" aria-label="移除图片"><X size={12}/></button>}</div>)}</div>
    </div>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4" onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <button type="button" onClick={() => setOpen(false)} className="absolute right-5 top-5 z-10 rounded-full bg-black/40 p-2 text-white" aria-label="关闭"><X size={30}/></button>
      {images.length > 1 && <><button type="button" onClick={previous} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white" aria-label="上一张图片"><ChevronLeft size={28}/></button><button type="button" onClick={next} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white" aria-label="下一张图片"><ChevronRight size={28}/></button><span className="absolute bottom-5 rounded-full bg-black/50 px-3 py-1 text-sm text-white">{active + 1} / {images.length}</span></>}
      <div className="max-h-full max-w-full touch-pan-y select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <img draggable="false" src={images[active].url} alt={images[active].name || '桌游图片'} className="max-h-[calc(100vh-2rem)] max-w-full object-contain" />
      </div>
    </div>}
  </>
}
