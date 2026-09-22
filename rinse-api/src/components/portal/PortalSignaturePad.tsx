'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentLocale } from '@rinse/core'
import { getDocumentStrings, normalizeDocumentLocale } from '@rinse/core'
import { Button } from '@/components/ui'

interface PortalSignaturePadProps {
  onSubmit: (dataUrl: string) => Promise<void>
  disabled?: boolean
  locale?: DocumentLocale
}

export default function PortalSignaturePad({ onSubmit, disabled, locale }: PortalSignaturePadProps) {
  const s = getDocumentStrings(normalizeDocumentLocale(locale))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111111'
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || busy) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = pointFromEvent(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled || busy) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointFromEvent(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasStroke(true)
  }

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    setError(null)
  }

  const submit = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasStroke) return
    setBusy(true)
    setError(null)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      await onSubmit(dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save signature')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="portal-signature">
      <p className="portal-signature__hint">{s.signPrompt}</p>
      <canvas
        ref={canvasRef}
        className="portal-signature__canvas"
        aria-label={s.signInvoice}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      />
      {error ? <p className="portal-inline-error">{error}</p> : null}
      <div className="portal-signature__actions">
        <Button variant="ghost" type="button" onClick={clear} disabled={busy || !hasStroke}>
          {s.clear}
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={() => void submit()}
          disabled={disabled || busy || !hasStroke}
        >
          {busy ? s.saving : s.signInvoice}
        </Button>
      </div>
    </div>
  )
}
