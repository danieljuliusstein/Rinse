#!/usr/bin/env node
/**
 * Poll an HTTP URL until it responds with an acceptable status (default 200–399).
 *
 * Usage:
 *   node scripts/wait-for-url.mjs http://127.0.0.1:3000/auth
 *   WAIT_TIMEOUT_MS=180000 node scripts/wait-for-url.mjs http://127.0.0.1:3000/auth
 */

const url = process.argv[2]
if (!url) {
  console.error('Usage: node scripts/wait-for-url.mjs <url>')
  process.exit(1)
}

const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || 120_000)
const intervalMs = Number(process.env.WAIT_INTERVAL_MS || 1_000)
const started = Date.now()

function okStatus(status) {
  return status >= 200 && status < 400
}

async function probe() {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(5_000),
  })
  return okStatus(res.status)
}

;(async () => {
  console.log(`[wait-for-url] Waiting for ${url} (timeout ${timeoutMs}ms)`)

  while (Date.now() - started < timeoutMs) {
    try {
      if (await probe()) {
        console.log(`[wait-for-url] Ready (${Date.now() - started}ms)`)
        process.exit(0)
      }
    } catch {
      // server still booting
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  console.error(`[wait-for-url] Timed out after ${timeoutMs}ms`)
  process.exit(1)
})()
