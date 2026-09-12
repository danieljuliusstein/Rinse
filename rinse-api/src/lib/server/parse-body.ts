import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { rejectOversizedBody } from './request-body'

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  maxBytes?: number,
): Promise<{ data: T } | NextResponse> {
  const tooLarge = maxBytes ? rejectOversizedBody(request, maxBytes) : rejectOversizedBody(request)
  if (tooLarge) return tooLarge

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid request body' },
      { status: 400 },
    )
  }

  return { data: result.data }
}

export function parseSearchParams<T>(
  request: Request,
  schema: ZodType<T>,
): { data: T } | NextResponse {
  const { searchParams } = new URL(request.url)
  const raw = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid query parameters' },
      { status: 400 },
    )
  }
  return { data: result.data }
}
