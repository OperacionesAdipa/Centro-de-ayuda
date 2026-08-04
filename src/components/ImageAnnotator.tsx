'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type Mode = 'anotar' | 'recortar' | 'redimensionar'

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
  const [mode, setMode] = useState<Mode>('anotar')
  const [scale, setScale] = useState(100)

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

  useEffect(() => {
    setRect(null)
    redraw(null)
  }, [mode])

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const r = canvas.getBoundingClientRect()
    const scaleX = canvas.width / r.width
    const scaleY = canvas.height / r.height
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
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
      if (mode === 'anotar') {
        ctx.strokeStyle = color
        ctx.lineWidth = 4
        ctx.setLineDash([])
        ctx.strokeRect(r.x, r.y, r.w, r.h)
        ctx.fillStyle = color === '#704EFD' ? 'rgba(112,78,253,0.1)' :
          color === '#ef4444' ? 'rgba(239,68,68,0.1)' :
          color === '#f97316' ? 'rgba(249,115,22,0.1)' :
          color === '#22c55e' ? 'rgba(34,197,94,0.1)' :
          color === '#0ea5e9' ? 'rgba(14,165,233,0.1)' : 'rgba(0,0,0,0.1)'
        ctx.fillRect(r.x, r.y, r.w, r.h)
      } else if (mode === 'recortar') {
        // Oscurecer área fuera del recorte
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.clearRect(r.x, r.y, r.w, r.h)
        ctx.drawImage(img, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 3])
        ctx.strokeRect(r.x, r.y, r.w, r.h)
      }
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode === 'redimensionar') return
    const pos = getPos(e)
    setStart(pos)
    setDrawing(true)
    setRect(null)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing || mode === 'redimensionar') return
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
    if (mode === 'redimensionar') return
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
    setScale(100)
  }

  async function save() {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    setSaving(true)

    let outputCanvas = canvas

    if (mode === 'recortar' && rect && rect.w > 0 && rect.h > 0) {
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = rect.w
      cropCanvas.height = rect.h
      const cropCtx = cropCanvas.getContext('2d')
      if (cropCtx) {
        cropCtx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
        outputCanvas = cropCanvas
      }
    } else if (mode === 'redimensionar') {
      const newW = Math.round(img.width * scale / 100)
      const newH = Math.round(img.height * scale / 100)
      const resizeCanvas = document.createElement('canvas')
      resizeCanvas.width = newW
      resizeCanvas.height = newH
      const resizeCtx = resizeCanvas.getContext('2d')
      if (resizeCtx) {
        resizeCtx.drawImage(img, 0, 0, newW, newH)
        outputCanvas = resizeCanvas
      }
    }

    outputCanvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return }
      const formData = new FormData()
      formData.append('file', blob, 'edited-' + Date.now() + '.jpg')
      const res = await fetch('/api/agent/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) onSave(data.url)
      setSaving(false)
    }, 'image/jpeg', 0.9)
  }

  const COLORS = ['#704EFD', '#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#000000']

  const canSave = mode === 'anotar' ? !!rect :
    mode === 'recortar' ? (!!rect && rect.w > 0 && rect.h > 0) :
    scale !== 100

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Tabs de modo */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
          {([
            { key: 'anotar', label: '✏️ Anotar' },
            { key: 'recortar', label: '✂️ Recortar' },
            { key: 'redimensionar', label: '↔️ Redimensionar' },
          ] as { key: Mode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                fontWeight: mode === tab.key ? 600 : 400,
                color: mode === tab.key ? 'var(--purple)' : 'var(--muted)',
                background: '#fff',
                borderBottom: mode === tab.key ? '2px solid var(--purple)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="agent-url-remove" onClick={onClose} style={{ fontSize: 18, margin: '8px 12px' }}>✕</button>
        </div>

        {/* Toolbar según modo */}
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#f8f8fc' }}>
          {mode === 'anotar' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Color:</span>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '3px solid #333' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
              <button className="agent-action-btn" onClick={clearRect}>Limpiar</button>
            </>
          )}
          {mode === 'recortar' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Arrastra para seleccionar el área a conservar</span>
              <button className="agent-action-btn" onClick={clearRect}>Limpiar</button>
            </>
          )}
          {mode === 'redimensionar' && (
            <>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tamaño:</span>
              <input
                type="range"
                min={10}
                max={200}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                style={{ width: 200 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', minWidth: 40 }}>{scale}%</span>
              {img && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {Math.round(img.width * scale / 100)} × {Math.round(img.height * scale / 100)} px
                </span>
              )}
              <button className="agent-action-btn" onClick={() => setScale(100)}>Resetear</button>
            </>
          )}
          <button className="agent-nav-btn primary" onClick={save} disabled={saving || !canSave} style={{ marginLeft: 'auto' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {/* Canvas */}
        <div style={{ overflow: 'auto', padding: 16 }}>
          {mode === 'redimensionar' ? (
            <div style={{ textAlign: 'center' }}>
              {img && (
                <img
                  src={imageUrl}
                  alt="preview"
                  style={{
                    width: Math.round(img.width * scale / 100),
                    height: Math.round(img.height * scale / 100),
                    maxWidth: '80vw',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              )}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              style={{ maxWidth: '80vw', maxHeight: '65vh', cursor: 'crosshair', display: 'block', border: '1px solid var(--border)', borderRadius: 8 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
