import { readFileSync, statSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

const DEBUG_ENDPOINT = 'http://127.0.0.1:7501/ingest/f04eb7ba-425d-4857-bab2-4c1fd3627881'
const SESSION_ID = '8503ec'

function logDebug(payload: Record<string, unknown>) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body: JSON.stringify({ sessionId: SESSION_ID, timestamp: Date.now(), ...payload }),
  }).catch(() => {})
  // #endregion
}

function parseCheck(source: string): { ok: boolean; error?: string } {
  try {
    // eslint-disable-next-line no-new-func
    new Function(source)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function GET(request: Request) {
  const distDir = process.env.NEXT_DIST_DIR ?? '.next'
  const layoutPath = join(process.cwd(), distDir, 'dev/static/chunks/app/layout.js')
  const origin = new URL(request.url).origin
  const chunkUrl = `${origin}/_next/static/chunks/app/layout.js`

  let diskSize = 0
  let diskParse: { ok: boolean; error?: string } = { ok: false, error: 'missing' }
  try {
    diskSize = statSync(layoutPath).size
    const diskSource = readFileSync(layoutPath, 'utf8')
    diskParse = parseCheck(diskSource)
  } catch (error) {
    diskParse = { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  let httpSize = 0
  let httpComplete = false
  let httpParse: { ok: boolean; error?: string } = { ok: false, error: 'not fetched' }
  try {
    const res = await fetch(chunkUrl)
    const buf = Buffer.from(await res.arrayBuffer())
    httpSize = buf.length
    httpComplete = res.ok && httpSize >= diskSize
    httpParse = parseCheck(buf.toString('utf8'))
  } catch (error) {
    httpParse = { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  const truncated = diskSize > 0 && httpSize > 0 && httpSize < diskSize

  logDebug({
    runId: 'chunk-health',
    hypothesisId: truncated ? 'H1' : httpParse.ok ? 'H5' : 'H3',
    location: 'api/debug/chunk-health/route.ts',
    message: truncated ? 'layout.js HTTP response truncated vs disk' : 'layout.js chunk health check',
    data: {
      distDir,
      layoutPath,
      diskSize,
      httpSize,
      truncated,
      httpComplete,
      diskParseOk: diskParse.ok,
      httpParseOk: httpParse.ok,
      httpParseError: httpParse.error,
      diskParseError: diskParse.error,
    },
  })

  return NextResponse.json({
    distDir,
    diskSize,
    httpSize,
    truncated,
    diskParse,
    httpParse,
  })
}
