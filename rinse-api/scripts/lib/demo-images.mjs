/**
 * Open-source placeholder images (Unsplash License).
 * Cached to marketing/assets/stock-photos/ on first seed run.
 * Replace files locally anytime — re-run npm run seed:demo.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

/** @type {{ id: string; url: string; filename: string; credit: string; unsplashId: string }[]} */
export const STOCK_CATALOG = [
  {
    id: 'before-exterior',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=960&q=85&auto=format&fit=crop',
    filename: '01-before-exterior.jpg',
    credit: 'Lamborghini on road — Unsplash',
    unsplashId: '1552519507-da3b142c6e3d',
  },
  {
    id: 'after-exterior',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=960&q=85&auto=format&fit=crop',
    filename: '02-after-exterior.jpg',
    credit: 'Porsche detail — Unsplash',
    unsplashId: '1503376780353-7e6692767b70',
  },
  {
    id: 'before-interior',
    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=960&q=85&auto=format&fit=crop',
    filename: '03-before-interior.jpg',
    credit: 'Car interior — Unsplash',
    unsplashId: '1549317661-bd32c8ce0db2',
  },
  {
    id: 'after-interior',
    url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=960&q=85&auto=format&fit=crop',
    filename: '04-after-interior.jpg',
    credit: 'Clean cabin — Unsplash',
    unsplashId: '1492144534655-ae79c964c9d7',
  },
  {
    id: 'damage-scratch',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=85&auto=format&fit=crop',
    filename: '05-damage-scratch.jpg',
    credit: 'Car body close-up — Unsplash',
    unsplashId: '1619642751034-765dfdf7c58e',
  },
  {
    id: 'vehicle-profile',
    url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=85&auto=format&fit=crop',
    filename: '06-vehicle-sedan.jpg',
    credit: 'Sedan — Unsplash',
    unsplashId: '1492144534655-ae79c964c9d7',
  },
  {
    id: 'truck-profile',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=85&auto=format&fit=crop',
    filename: '07-vehicle-truck.jpg',
    credit: 'Pickup truck — Unsplash',
    unsplashId: '1533473359331-0135ef1b58bf',
  },
  {
    id: 'supply-product',
    url: 'https://images.unsplash.com/photo-1486261485612-62f856299a55?w=600&q=85&auto=format&fit=crop',
    filename: '08-supply-bottles.jpg',
    credit: 'Workshop — Unsplash',
    unsplashId: '1486261485612-62f856299a55',
  },
  {
    id: 'logo-mark',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=85&auto=format&fit=crop',
    filename: '09-logo-placeholder.jpg',
    credit: 'Detail shine — Unsplash',
    unsplashId: '1503376780353-7e6692767b70',
  },
]

const SOURCES_MD = `# Stock photo sources

Placeholder images from [Unsplash](https://unsplash.com/license) (free to use).
Replace any file here with your own photos, then run \`npm run seed:demo\`.

| File | Credit |
|------|--------|
${STOCK_CATALOG.map((i) => `| ${i.filename} | ${i.credit} |`).join('\n')}
`

/**
 * @param {string} dir
 * @param {{ force?: boolean }} [opts]
 */
export async function ensureStockPhotos(dir, opts = {}) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'SOURCES.md'), SOURCES_MD)

  const downloaded = []
  for (const item of STOCK_CATALOG) {
    const dest = join(dir, item.filename)
    if (existsSync(dest) && !opts.force) {
      downloaded.push({ ...item, path: dest, buffer: readFileSync(dest) })
      continue
    }
    const res = await fetch(item.url, {
      headers: { 'User-Agent': 'detailing-app-seed/1.0' },
    })
    let buffer
    if (!res.ok) {
      const fallback = await fetch(`https://picsum.photos/seed/${item.id}/960/720`, {
        headers: { 'User-Agent': 'detailing-app-seed/1.0' },
        redirect: 'follow',
      })
      if (!fallback.ok) {
        throw new Error(`Failed to download ${item.filename}: HTTP ${res.status}`)
      }
      buffer = Buffer.from(await fallback.arrayBuffer())
      console.log(`  ↓ ${item.filename} (picsum fallback)`)
    } else {
      buffer = Buffer.from(await res.arrayBuffer())
      console.log(`  ↓ ${item.filename}`)
    }
    writeFileSync(dest, buffer)
    downloaded.push({ ...item, path: dest, buffer })
  }
  return downloaded
}

/** @param {string} dir @param {string} filename */
export function readStockFile(dir, filename) {
  const path = join(dir, filename)
  if (!existsSync(path)) return null
  return { path, buffer: readFileSync(path), filename }
}

/** Job gallery: alternating before/after labels */
export function jobPhotoSet(dir) {
  const names = [
    '01-before-exterior.jpg',
    '02-after-exterior.jpg',
    '03-before-interior.jpg',
    '04-after-interior.jpg',
  ]
  return names
    .map((filename, i) => {
      const file = readStockFile(dir, filename)
      if (!file) return null
      return {
        ...file,
        type: i % 2 === 0 ? 'before' : 'after',
      }
    })
    .filter(Boolean)
}
