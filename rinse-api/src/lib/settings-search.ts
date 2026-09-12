import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { ChatTeardropText, Kanban, Lifebuoy } from '@phosphor-icons/react'
import { SUPPORT_FAQ, type SupportFaqItem } from './support-config'
import {
  SETTINGS_MENU_ITEMS,
  type SettingsIconTone,
  type SettingsMenuItem,
} from './settings-menu'

export type SettingsSearchResultKind = 'menu' | 'faq' | 'shortcut'

export interface SettingsSearchResult {
  kind: SettingsSearchResultKind
  score: number
  similar: boolean
  matchHint: string | null
  title: string
  subtitle: string
  href: string
  menuItem?: SettingsMenuItem
  faq?: SupportFaqItem
  Icon?: PhosphorIcon
  tone?: SettingsIconTone
}

interface SearchableEntry {
  kind: SettingsSearchResultKind
  title: string
  subtitle: string
  href: string
  fields: { text: string; weight: number }[]
  menuItem?: SettingsMenuItem
  faq?: SupportFaqItem
  Icon?: PhosphorIcon
  tone?: SettingsIconTone
}

const SETTINGS_SHORTCUTS: SearchableEntry[] = [
  {
    kind: 'shortcut',
    title: 'Lead pipeline',
    subtitle: 'Track inquiries before they become clients',
    href: '/pipeline',
    Icon: Kanban,
    tone: 'purple',
    fields: [
      { text: 'Lead pipeline', weight: 4 },
      { text: 'pipeline leads inquiry sales funnel prospects', weight: 3 },
    ],
  },
  {
    kind: 'shortcut',
    title: 'Messages',
    subtitle: 'Auto messages and sent client texts',
    href: '/messages',
    Icon: ChatTeardropText,
    tone: 'blue',
    fields: [
      { text: 'Messages', weight: 4 },
      { text: 'auto messages sms email text reminder appointment', weight: 3 },
    ],
  },
]

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const next = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost)
      row[j - 1] = prev
      prev = next
    }
    row[b.length] = prev
  }
  return row[b.length]
}

function splitWords(text: string): string[] {
  return normalize(text)
    .split(/[\s&/,–—-]+/)
    .filter(Boolean)
}

function wordMatchScore(token: string, field: string, weight: number): number {
  const normalizedField = normalize(field)
  if (!token || !normalizedField) return 0

  if (normalizedField.includes(token)) {
    if (normalizedField === token) return weight * 3
    if (normalizedField.startsWith(token)) return weight * 2.4
    return weight * 1.6
  }

  let best = 0
  for (const word of splitWords(field)) {
    if (word.startsWith(token)) {
      best = Math.max(best, weight * 2)
      continue
    }
    if (token.length < 3 || word.length < 3) continue

    const distance = levenshtein(token, word)
    const maxLen = Math.max(token.length, word.length)
    if (distance === 1 && maxLen <= 10) best = Math.max(best, weight * 1.1)
    else if (distance === 2 && maxLen >= 5) best = Math.max(best, weight * 0.65)
  }

  return best
}

function scoreEntry(
  query: string,
  entry: SearchableEntry,
  mode: 'strict' | 'relaxed',
): { score: number; matchHint: string | null } {
  const q = normalize(query)
  if (!q) return { score: 1, matchHint: null }

  const phraseBonus = entry.fields.some((field) => normalize(field.text).includes(q)) ? 36 : 0
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { score: 0, matchHint: null }

  let total = phraseBonus
  const matchedTokens: string[] = []
  let failedTokens = 0

  for (const token of tokens) {
    let bestTokenScore = 0
    for (const field of entry.fields) {
      bestTokenScore = Math.max(bestTokenScore, wordMatchScore(token, field.text, field.weight))
    }

    if (bestTokenScore >= 0.5) {
      total += bestTokenScore
      matchedTokens.push(token)
    } else {
      failedTokens += 1
    }
  }

  if (mode === 'strict' && failedTokens > 0) return { score: 0, matchHint: null }
  if (mode === 'relaxed' && matchedTokens.length === 0) return { score: 0, matchHint: null }

  const matchHint =
    matchedTokens.length > 0
      ? failedTokens > 0
        ? `Similar match · ${matchedTokens.join(', ')}`
        : `Matches: ${matchedTokens.join(', ')}`
      : null

  if (mode === 'relaxed' && failedTokens > 0) total *= 0.72

  return { score: total, matchHint }
}

function menuEntry(item: SettingsMenuItem): SearchableEntry {
  return {
    kind: 'menu',
    title: item.title,
    subtitle: item.subtitle,
    href: item.href,
    menuItem: item,
    Icon: item.Icon,
    tone: item.tone,
    fields: [
      { text: item.title, weight: 4 },
      { text: item.subtitle, weight: 2.5 },
      { text: item.group, weight: 1.5 },
      { text: item.searchKeys.join(' '), weight: 3 },
    ],
  }
}

function faqEntry(item: SupportFaqItem): SearchableEntry {
  return {
    kind: 'faq',
    title: item.question,
    subtitle: 'FAQ answer',
    href: `/settings/faq#${item.id}`,
    faq: item,
    Icon: Lifebuoy,
    tone: 'blue',
    fields: [
      { text: item.question, weight: 3.5 },
      { text: item.answer, weight: 2 },
      { text: item.id.replace(/-/g, ' '), weight: 2.5 },
    ],
  }
}

function allEntries(): SearchableEntry[] {
  return [
    ...SETTINGS_MENU_ITEMS.map(menuEntry),
    ...SETTINGS_SHORTCUTS,
    ...SUPPORT_FAQ.map(faqEntry),
  ]
}

function toResult(
  entry: SearchableEntry,
  score: number,
  matchHint: string | null,
  similar: boolean,
): SettingsSearchResult {
  return {
    kind: entry.kind,
    score,
    similar,
    matchHint,
    title: entry.title,
    subtitle: entry.subtitle,
    href: entry.href,
    menuItem: entry.menuItem,
    faq: entry.faq,
    Icon: entry.Icon,
    tone: entry.tone,
  }
}

export function searchSettings(query: string): SettingsSearchResult[] {
  const q = query.trim()
  if (!q) return []

  const strict = allEntries()
    .map((entry) => {
      const { score, matchHint } = scoreEntry(q, entry, 'strict')
      return score > 0 ? toResult(entry, score, matchHint, false) : null
    })
    .filter((result): result is SettingsSearchResult => result !== null)
    .sort((a, b) => b.score - a.score)

  if (strict.length > 0) return strict

  return allEntries()
    .map((entry) => {
      const { score, matchHint } = scoreEntry(q, entry, 'relaxed')
      return score > 0 ? toResult(entry, score, matchHint, true) : null
    })
    .filter((result): result is SettingsSearchResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

/** Match settings search query against section title, description, and keyword list. */
export function matchesSettingsSearch(query: string, parts: string[]): boolean {
  const q = query.trim()
  if (!q) return true
  return scoreEntry(
    q,
    { kind: 'menu', title: '', subtitle: '', href: '', fields: parts.map((text) => ({ text, weight: 2 })) },
    'strict',
  ).score > 0
}

export function countMatchingSettingsSections(query: string): number {
  return searchSettings(query).filter((result) => result.kind === 'menu').length
}
