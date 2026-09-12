#!/usr/bin/env node
/**
 * Resize raw screenshots + compress hero video for detailingSignUP.
 * Requires: marketing/raw/screenshots/, optional marketing/raw/video/product-demo.mp4
 *
 * Usage: npm run export:waitlist-assets
 */

import { existsSync, mkdirSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import sharp from 'sharp'

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

async function resizePng(src, dest, width, height) {
  await sharp(src)
    .resize(width, height, { fit: 'cover', position: 'top' })
    .webp({ quality: 82 })
    .toFile(dest.replace(/\.(jpg|png)$/i, '.webp'))
  await sharp(src)
    .resize(width, height, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 85 })
    .toFile(dest.replace(/\.webp$/, '.jpg'))
}

async function main() {
  if (!existsSync(rawScreens)) {
    console.error('No marketing/raw/screenshots/ — run: npm run capture:screenshots')
    process.exit(1)
  }

  mkdirSync(outDir, { recursive: true })
  const files = new Set(readdirSync(rawScreens))

  for (const name of HERO_SOURCES) {
    if (!files.has(name)) continue
    const src = join(rawScreens, name)
    await resizePng(src, join(outDir, 'hero-poster.webp'), 800, 1733)
    console.log('  hero-poster.webp + .jpg')
  }

  const featureNames = ['home', 'jobs', 'photos', 'booking', 'portal']
  let i = 0
  for (const name of FEATURE_SOURCES) {
    if (!files.has(name)) continue
    const src = join(rawScreens, name)
    const label = featureNames[i] ?? `feature-${i}`
    await resizePng(src, join(outDir, `feature-${label}.webp`), 600, 1300)
    console.log(`  feature-${label}.webp`)
    i++
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
  console.log('Copy to ../detailingSignUP/assets/ when wiring the waitlist page.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
