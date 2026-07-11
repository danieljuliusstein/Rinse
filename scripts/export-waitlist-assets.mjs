#!/usr/bin/env node
/**
 * Resize native marketing captures for the waitlist / marketing site.
 *
 * Requires: marketing/raw/screenshots/ from `npm run marketing:capture`
 * Optional: marketing/raw/video/product-demo.mp4 + ffmpeg
 *
 * Usage: npm run marketing:export
 */

import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawScreens = join(root, 'marketing', 'raw', 'screenshots')
const rawVideo = join(root, 'marketing', 'raw', 'video', 'product-demo.mp4')
const outDir = join(root, 'marketing', 'export', 'waitlist')

const HERO_SOURCES = ['01-home.png']
const FEATURE_SOURCES = [
  '01-home.png',
  '02-jobs.png',
  '04-job-photos.png',
  '08-booking-step1.png',
  '10-portal.png',
]
const FEATURE_LABELS = ['home', 'jobs', 'photos', 'booking', 'portal']

async function main() {
  if (!existsSync(rawScreens)) {
    console.error('No marketing/raw/screenshots/ — run: npm run marketing:capture')
    process.exit(1)
  }

  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('Missing sharp — run: npm install -D sharp')
    process.exit(1)
  }

  mkdirSync(outDir, { recursive: true })
  const files = new Set(readdirSync(rawScreens))

  async function resizePng(src, destBase, width, height) {
    await sharp(src)
      .resize(width, height, { fit: 'cover', position: 'top' })
      .webp({ quality: 82 })
      .toFile(`${destBase}.webp`)
    await sharp(src)
      .resize(width, height, { fit: 'cover', position: 'top' })
      .jpeg({ quality: 85 })
      .toFile(`${destBase}.jpg`)
  }

  for (const name of HERO_SOURCES) {
    if (!files.has(name)) continue
    await resizePng(join(rawScreens, name), join(outDir, 'hero-poster'), 800, 1733)
    console.log('  hero-poster.webp + .jpg')
  }

  let i = 0
  for (const name of FEATURE_SOURCES) {
    if (!files.has(name)) {
      console.warn(`  ⚠ missing ${name}`)
      continue
    }
    const label = FEATURE_LABELS[i] ?? `feature-${i}`
    await resizePng(join(rawScreens, name), join(outDir, `feature-${label}`), 600, 1300)
    console.log(`  feature-${label}.webp + .jpg`)
    i += 1
  }

  if (existsSync(rawVideo)) {
    const dest = join(outDir, 'hero-demo.mp4')
    try {
      execSync(
        `ffmpeg -y -i "${rawVideo}" -vf "scale=720:-2" -c:v libx264 -crf 28 -an -movflags +faststart "${dest}"`,
        { stdio: 'inherit' },
      )
      console.log('  hero-demo.mp4')
    } catch {
      console.warn('ffmpeg failed — install ffmpeg or add hero-demo.mp4 manually')
    }
  } else {
    console.log('  (skip video — add marketing/raw/video/product-demo.mp4)')
  }

  console.log(`\nExport ready: ${outDir}`)
  console.log('Copy into your waitlist / marketing site assets folder.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
