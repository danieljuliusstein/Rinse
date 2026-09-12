import { NextResponse } from 'next/server'

const DEFAULT_MAX_BYTES = 32_768

export function rejectOversizedBody(request: Request, maxBytes = DEFAULT_MAX_BYTES): NextResponse | null {
  const raw = request.headers.get('content-length')
  if (!raw) return null
  const length = Number(raw)
  if (!Number.isFinite(length) || length <= maxBytes) return null
  return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
}
