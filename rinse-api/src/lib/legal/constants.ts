import { APP_DISPLAY_NAME } from '@/lib/support-config'

export const LEGAL_UPDATED = 'July 6, 2026'

export function getLegalEntityName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_ENTITY?.trim() || `${APP_DISPLAY_NAME}, Inc., a Georgia corporation`
}
