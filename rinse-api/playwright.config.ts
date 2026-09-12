import { defineConfig } from '@playwright/test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function loadEnvLocal(): void {
  const envPath = join(__dirname, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    process.env[key] = val
  }
}

loadEnvLocal()

const appUrl = process.env.APP_URL || 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 120_000,
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: appUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  use: {
    baseURL: appUrl,
    trace: 'on-first-retry',
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
  ],
})
