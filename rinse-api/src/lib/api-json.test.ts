import { describe, expect, it } from 'vitest'
import { readApiJson } from './api-json'

describe('readApiJson', () => {
  it('parses valid JSON', async () => {
    const res = new Response(JSON.stringify({ ok: true }), { status: 200 })
    const data = await readApiJson(res)
    expect(data.ok).toBe(true)
  })

  it('throws on empty body', async () => {
    const res = new Response('', { status: 500 })
    await expect(readApiJson(res)).rejects.toThrow('Request failed (500)')
  })
})
