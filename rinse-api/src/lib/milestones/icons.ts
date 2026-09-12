import {
  Briefcase,
  CalendarCheck,
  CurrencyDollar,
  Medal,
  Trophy,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import type { MilestoneIcon } from '@/lib/milestones/types'

export function milestoneIconComponent(icon: MilestoneIcon): PhosphorIcon {
  switch (icon) {
    case 'trophy':
      return Trophy
    case 'medal':
      return Medal
    case 'briefcase':
      return Briefcase
    case 'dollar':
      return CurrencyDollar
    case 'calendar':
      return CalendarCheck
  }
}
