'use client'

import { useRef, useState, useEffect } from 'react'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  imageUrl: string
  onSave: (annotatedUrl: string) => void
  onClose: () => void
}

export function ImageAnnotator({ imageUrl, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [rect, setRect] = useState<Rect | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [color, setColor] = useState('#704EFD')

  useEffect(() => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageUrl
    image.onload = () => {
      setImg(image)
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(image, 0, 0)
    }
  }, [imageUrl])

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function redraw(r?: Rect | null) {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    if (r) {
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      ctx.setLineDash([])
      ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba').replace('#704EFD', 'rgba(112,78,253,0.1)')
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getPos(e)
    setStart(pos)
    setDrawing(true)
    setRect(null)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const pos = getPos(e)
    const r = {
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    }
    setRect(r)
    redraw(r)
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    setDrawing(false)
    const pos = getPos(e)
    const r = {
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    }
    setRect(r)
    redraw(r)
  }

  function clearRect() {
    setRect(null)
    redraw(null)
  }

  async function save() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)

    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return }

      const formData = new FormData()
      formData.append('file', blob, 'annotated-' + Date.now() + '.jpg')

      const res = await fetch('/api/agent/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        onSave(data.url)
      }
      setSaving(false)
    }, 'image/jpeg', 0.9)
  }

  const COLORS = ['#704EFD', '#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#000000']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Anotar imagen</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Color:</span>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '3px solid #333' : '2px solid transparent', cursor: 'pointer' }}
              />
            ))}
            <button className="agent-action-btn" onClick={clearRect} style={{ marginLeft: 8 }}>Limpiar</button>
            <button className="agent-nav-btn primary" onClick={save} disabled={saving || !rect}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="agent-url-remove" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
          </div>
        </div>
        <div style={{ overflow: 'auto', padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Arrastra para dibujar un recuadro sobre la imagen.</p>
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            style={{ maxWidth: '80vw', maxHeight: '70vh', cursor: 'crosshair', display: 'block', border: '1px solid var(--border)', borderRadius: 8 }}
          />
        </div>
      </div>
    </div>
  )
}
