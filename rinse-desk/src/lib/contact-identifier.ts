import { IDENTIFIER_STYLES } from '@/theme/colors'
import type { DeskClient } from '@/lib/types'

export type ContactIdentifier = keyof typeof IDENTIFIER_STYLES

export const IDENTIFIERS: ContactIdentifier[] = ['Account', 'Prospect', 'Type', 'Client']

export const ID_TAG_PREFIX = 'id:'

export function readIdentifier(client: DeskClient): ContactIdentifier {
  const tag = client.tags?.find((t) => t.startsWith(ID_TAG_PREFIX))
  if (tag) {
    const value = tag.slice(ID_TAG_PREFIX.length) as ContactIdentifier
    if (IDENTIFIERS.includes(value)) return value
  }
  if (client.lead_source) return 'Prospect'
  if (client.parent_client_id) return 'Account'
  return 'Client'
}

export function tagsWithIdentifier(
  existing: string[] | undefined,
  identifier: ContactIdentifier,
): string[] {
  const rest = (existing ?? []).filter(
    (t) => !t.startsWith(ID_TAG_PREFIX) && !IDENTIFIERS.includes(t as ContactIdentifier),
  )
  return [`${ID_TAG_PREFIX}${identifier}`, ...rest]
}

export function identifierStyle(identifier: ContactIdentifier) {
  return IDENTIFIER_STYLES[identifier]
}
