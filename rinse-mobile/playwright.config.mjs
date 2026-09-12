import { defineConfig } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const auditRoot = join(root, 'screenshots/audit-2026-07-07')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(join(root, '.env'))

const appUrl = (process.env.NATIVE_VISUAL_URL || 'http://127.0.0.1:8081').replace(/\/$/, '')

const sharedUse = {
  baseURL: appUrl,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  browserName: 'chromium',
  // Match manual audit still dimensions (1555×1337).
  viewport: { width: 1555, height: 1337 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
}

const marketingUse = {
  baseURL: appUrl,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  browserName: 'chromium',
  // Waitlist / App Store style iPhone frame (matches prior PWA marketing captures).
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 120_000,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: 'npm run web -- --port 8081',
        url: appUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        cwd: root,
      },
  projects: [
    {
      name: 'native-audit',
      grep: /Native visual audit/,
      snapshotPathTemplate: `${join(auditRoot, 'native')}/{arg}{ext}`,
      use: sharedUse,
    },
    {
      name: 'pwa-parity',
      grep: /PWA audit — loose parity/,
      snapshotPathTemplate: `${join(auditRoot, 'pwa')}/{arg}{ext}`,
      use: sharedUse,
    },
    {
      name: 'motion-smoke',
      grep: /Motion smoke/,
      use: sharedUse,
    },
    {
      name: 'marketing-capture',
      grep: /Native marketing capture/,
      use: marketingUse,
    },
  ],
})
