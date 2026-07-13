#!/usr/bin/env node
/**
 * Scrape marketing-site design tokens from SaaS / CRM landing pages
 * (Perspective-style: bold hero, saturated CTA, clean type, soft cards).
 *
 * Usage:
 *   node scripts/scrape-saas-design.mjs
 *   node scripts/scrape-saas-design.mjs https://www.perspective.co https://attio.com
 *   npm run design:scrape
 *
 * Writes JSON + Markdown under design-references/saas-sites/
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../design-references/saas-sites')

const DEFAULT_SEEDS = [
  { url: 'https://www.perspective.co/', category: 'funnels-crm' },
  { url: 'https://attio.com/', category: 'crm' },
  { url: 'https://www.attio.com/', category: 'crm' },
  { url: 'https://linear.app/', category: 'saas' },
  { url: 'https://www.notion.so/product', category: 'saas' },
  { url: 'https://www.hubspot.com/', category: 'crm' },
  { url: 'https://www.close.com/', category: 'crm' },
  { url: 'https://www.pipedrive.com/', category: 'crm' },
  { url: 'https://www.copper.com/', category: 'crm' },
  { url: 'https://www.folk.app/', category: 'crm' },
]

function slugFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase()
  } catch {
    return `site-${Date.now()}`
  }
}

function parseArgs(argv) {
  const urls = argv.filter((a) => /^https?:\/\//i.test(a))
  const screenshot = !argv.includes('--no-screenshot')
  return { urls, screenshot }
}

async function dismissConsent(page) {
  const candidates = [
    'button:has-text("Allow all")',
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'a:has-text("Allow all")',
    '[id*="accept"]',
    '[data-testid*="accept"]',
  ]
  for (const sel of candidates) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 1500 })
        await page.waitForTimeout(400)
        return
      }
    } catch {
      // try next
    }
  }
}

async function scrapePage(page, url, { screenshot }) {
  const started = Date.now()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await dismissConsent(page)
  await page.waitForTimeout(1200)

  const tokens = await page.evaluate(() => {
    const pick = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || '').trim().slice(0, 120),
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        padding: cs.padding,
        margin: cs.margin,
      }
    }

    const body = document.body
    const h1 = document.querySelector('h1')
    const h2 = document.querySelector('h2')
    const nav = document.querySelector('header, nav, [role="banner"]')
    const buttons = [...document.querySelectorAll('a, button')].filter((el) => {
      const t = (el.innerText || '').trim().toLowerCase()
      return (
        t.includes('try') ||
        t.includes('start') ||
        t.includes('get started') ||
        t.includes('sign up') ||
        t.includes('book') ||
        t.includes('demo') ||
        t.includes('free')
      )
    })
    const primaryCta = buttons[0] || document.querySelector('a[class*="button"], button')
    const cards = [...document.querySelectorAll('section, article, [class*="card"]')].slice(0, 8)

    const colorHits = new Map()
    const fontHits = new Map()
    const radiusHits = new Map()
    const shadowHits = new Map()

    const sample = [
      body,
      h1,
      h2,
      nav,
      primaryCta,
      ...cards,
      ...document.querySelectorAll('p, a, button, span'),
    ].filter(Boolean)

    for (const el of sample.slice(0, 200)) {
      const cs = getComputedStyle(el)
      for (const [key, map] of [
        [cs.color, colorHits],
        [cs.backgroundColor, colorHits],
        [cs.borderColor, colorHits],
      ]) {
        if (!key || key === 'rgba(0, 0, 0, 0)' || key === 'transparent') continue
        map.set(key, (map.get(key) || 0) + 1)
      }
      if (cs.fontFamily) fontHits.set(cs.fontFamily, (fontHits.get(cs.fontFamily) || 0) + 1)
      if (cs.borderRadius && cs.borderRadius !== '0px') {
        radiusHits.set(cs.borderRadius, (radiusHits.get(cs.borderRadius) || 0) + 1)
      }
      if (cs.boxShadow && cs.boxShadow !== 'none') {
        shadowHits.set(cs.boxShadow, (shadowHits.get(cs.boxShadow) || 0) + 1)
      }
    }

    const top = (map, n = 8) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([value, count]) => ({ value, count }))

    const cssVars = {}
    const root = getComputedStyle(document.documentElement)
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || []) {
          if (!(rule instanceof CSSStyleRule)) continue
          if (rule.selectorText !== ':root' && rule.selectorText !== 'html') continue
          for (const name of rule.style) {
            if (name.startsWith('--')) cssVars[name] = root.getPropertyValue(name).trim()
          }
        }
      } catch {
        // cross-origin stylesheet
      }
    }

    return {
      title: document.title,
      metaDescription:
        document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
      body: pick(body),
      hero: {
        h1: pick(h1),
        h2: pick(h2),
        supporting: pick(h1?.nextElementSibling || document.querySelector('h1 + p')),
      },
      nav: pick(nav),
      primaryCta: pick(primaryCta),
      palette: top(colorHits, 12),
      fonts: top(fontHits, 6),
      radii: top(radiusHits, 8),
      shadows: top(shadowHits, 6),
      cssVariables: cssVars,
      layoutNotes: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        hasStickyHeader: Boolean(
          nav && ['fixed', 'sticky'].includes(getComputedStyle(nav).position),
        ),
        sectionCount: document.querySelectorAll('section').length,
      },
    }
  })

  const slug = slugFromUrl(url)
  let screenshotPath = null
  if (screenshot) {
    screenshotPath = path.join(OUT_DIR, `${slug}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
  }

  return {
    url,
    slug,
    scrapedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    screenshot: screenshotPath ? path.basename(screenshotPath) : null,
    ...tokens,
  }
}

function toMarkdown(report) {
  const lines = [
    `# ${report.title || report.slug}`,
    '',
    `- URL: ${report.url}`,
    `- Scraped: ${report.scrapedAt}`,
    report.screenshot ? `- Screenshot: \`${report.screenshot}\`` : null,
    report.metaDescription ? `- Description: ${report.metaDescription}` : null,
    '',
    '## Hero',
    report.hero?.h1
      ? `- H1: “${report.hero.h1.text}” · ${report.hero.h1.fontFamily} · ${report.hero.h1.fontSize}/${report.hero.h1.fontWeight} · ${report.hero.h1.color}`
      : '- H1: (not found)',
    report.primaryCta
      ? `- Primary CTA: “${report.primaryCta.text}” · bg ${report.primaryCta.backgroundColor} · radius ${report.primaryCta.borderRadius}`
      : '- Primary CTA: (not found)',
    '',
    '## Palette (top colors)',
    ...(report.palette || []).map((c) => `- \`${c.value}\` (${c.count})`),
    '',
    '## Fonts',
    ...(report.fonts || []).map((f) => `- ${f.value} (${f.count})`),
    '',
    '## Radii',
    ...(report.radii || []).map((r) => `- \`${r.value}\` (${r.count})`),
    '',
    '## Shadows',
    ...(report.shadows || []).slice(0, 4).map((s) => `- \`${s.value}\``),
    '',
    '## CSS variables',
    ...Object.entries(report.cssVariables || {})
      .slice(0, 40)
      .map(([k, v]) => `- \`${k}\`: ${v}`),
    '',
  ].filter((l) => l !== null)
  return lines.join('\n')
}

async function main() {
  const { urls, screenshot } = parseArgs(process.argv.slice(2))
  const seeds =
    urls.length > 0
      ? urls.map((url) => ({ url, category: 'custom' }))
      : DEFAULT_SEEDS.filter(
          (s, i, arr) => arr.findIndex((x) => slugFromUrl(x.url) === slugFromUrl(s.url)) === i,
        )

  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  })

  const results = []
  for (const seed of seeds) {
    const page = await context.newPage()
    process.stdout.write(`Scraping ${seed.url} … `)
    try {
      const report = await scrapePage(page, seed.url, { screenshot })
      report.category = seed.category
      results.push(report)
      await writeFile(path.join(OUT_DIR, `${report.slug}.json`), JSON.stringify(report, null, 2) + '\n')
      await writeFile(path.join(OUT_DIR, `${report.slug}.md`), toMarkdown(report) + '\n')
      console.log('ok')
    } catch (err) {
      console.log('failed')
      console.error(`  ${err instanceof Error ? err.message : err}`)
      results.push({
        url: seed.url,
        slug: slugFromUrl(seed.url),
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      await page.close()
    }
  }

  await browser.close()

  const index = {
    generatedAt: new Date().toISOString(),
    count: results.length,
    sites: results.map((r) => ({
      slug: r.slug,
      url: r.url,
      title: r.title || null,
      category: r.category || null,
      error: r.error || null,
      screenshot: r.screenshot || null,
    })),
  }
  await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n')

  const summaryMd = [
    '# SaaS / CRM design scrapes',
    '',
    `Generated ${index.generatedAt}`,
    '',
    'Perspective-inspired marketing sites (and similar CRM/SaaS landings). Each folder entry has `.json` tokens + `.md` notes.',
    '',
    ...index.sites.map((s) =>
      s.error
        ? `- **${s.slug}** — failed: ${s.error}`
        : `- **[${s.title || s.slug}](${s.url})** — \`${s.slug}.md\`${s.screenshot ? ` · screenshot` : ''}`,
    ),
    '',
  ].join('\n')
  await writeFile(path.join(OUT_DIR, 'README.md'), summaryMd)

  console.log(`\nWrote ${results.length} reports → ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
