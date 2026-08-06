import type { ContactIdentifier } from '@/lib/contact-identifier'
import { IDENTIFIER_STYLES } from '@/theme/colors'

export const IDENTIFIER_META: Record<
  ContactIdentifier,
  { label: string; chip: string; dot: string; bg: string; text: string }
> = {
  Account: {
    label: 'Account',
    chip: 'ring-blue-800/15',
    dot: 'bg-[#1E40AF]',
    bg: IDENTIFIER_STYLES.Account.bg,
    text: IDENTIFIER_STYLES.Account.text,
  },
  Prospect: {
    label: 'Prospect',
    chip: 'ring-amber-900/15',
    dot: 'bg-[#92400E]',
    bg: IDENTIFIER_STYLES.Prospect.bg,
    text: IDENTIFIER_STYLES.Prospect.text,
  },
  Type: {
    label: 'Type',
    chip: 'ring-purple-800/15',
    dot: 'bg-[#6B21A8]',
    bg: IDENTIFIER_STYLES.Type.bg,
    text: IDENTIFIER_STYLES.Type.text,
  },
  Client: {
    label: 'Client',
    chip: 'ring-emerald-800/15',
    dot: 'bg-[#065F46]',
    bg: IDENTIFIER_STYLES.Client.bg,
    text: IDENTIFIER_STYLES.Client.text,
  },
}

export type AvatarToneKey = 'teal' | 'blue' | 'amber' | 'pink'

export const AVATAR_TONE_CLASS: Record<AvatarToneKey, string> = {
  teal: 'bg-teal-100 text-teal-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  pink: 'bg-pink-100 text-pink-800',
}

export const AVATAR_TONE_KEYS: AvatarToneKey[] = ['teal', 'blue', 'amber', 'pink']
