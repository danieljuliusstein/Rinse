#!/usr/bin/env node
/**
 * Local pre-push gate — unit tests + E2E smoke.
 *
 * Reuses a server already on APP_URL (dev or prod). Otherwise builds and
 * starts `next start`, then tears it down when finished.
 *
 * Bypass: PREPUSH_SKIP=1 git push
 * Force rebuild: PREPUSH_FORCE_BUILD=1 npm run prepush
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appUrl = process.env.APP_URL || 'http://127.0.0.1:3000'
const authUrl = `${appUrl.replace(/\/$/, '')}/auth`
const pidFile = '/tmp/detailing-prepush-next.pid'

function run(cmd, extraEnv = {}) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  })
}

async function serverReady(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(5_000),
    })
    return res.status >= 200 && res.status < 400
  } catch {
    return false
  }
}

function stopStartedServer() {
  if (!existsSync(pidFile)) return
  const pid = readFileSync(pidFile, 'utf8').trim()
  if (pid) {
    try {
      process.kill(Number(pid), 'SIGTERM')
    } catch {
      /* already stopped */
    }
  }
  try {
    unlinkSync(pidFile)
  } catch {
    /* ignore */
  }
  console.log('[prepush] Stopped production server')
}

async function main() {
  if (process.env.PREPUSH_SKIP === '1') {
    console.log('[prepush] PREPUSH_SKIP=1 — skipping gate')
    return
  }

  run('npm test')

  const forceBuild = process.env.PREPUSH_FORCE_BUILD === '1'
  const alreadyUp = !forceBuild && (await serverReady(authUrl))
  let weStartedServer = false

  try {
    if (!alreadyUp) {
      console.log(`[prepush] No server at ${authUrl} — build + next start`)
      run('npm run build')
      execSync('npm run start > /tmp/detailing-prepush-next.log 2>&1 & echo $! > /tmp/detailing-prepush-next.pid', {
        cwd: root,
        shell: true,
        stdio: 'inherit',
      })
      weStartedServer = true
      run(`node scripts/wait-for-url.mjs ${authUrl}`)
    } else {
      console.log(`[prepush] Reusing server at ${authUrl}`)
    }

    run('npm run test:e2e:smoke', { PW_NO_SERVER: '1', APP_URL: appUrl })
  } finally {
    if (weStartedServer) stopStartedServer()
  }
}

main().catch((err) => {
  console.error('[prepush] Failed:', err.message || err)
  process.exit(1)
})
