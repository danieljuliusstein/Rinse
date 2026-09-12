import {
  Rocket,
  GitBranch,
  CalendarCheck,
  Inbox,
  Link2,
  SlidersHorizontal,
  Store,
  Lightbulb,
  PlusCircle,
  MessageSquarePlus,
  FileText,
  Receipt,
  Wallet,
  CalendarDays,
  Map,
  Car,
  Megaphone,
  ClipboardList,
  Workflow,
  ListTodo,
  Bell,
  Sparkles,
  LayoutDashboard,
  CircleHelp,
} from 'lucide-react'

const iconMap = {
  Rocket,
  GitBranch,
  CalendarCheck,
  Inbox,
  Link2,
  SlidersHorizontal,
  Store,
  Lightbulb,
  PlusCircle,
  MessageSquarePlus,
  FileText,
  Receipt,
  Wallet,
  CalendarDays,
  Map,
  Car,
  Megaphone,
  ClipboardList,
  Workflow,
  ListTodo,
  Bell,
  Sparkles,
  LayoutDashboard,
  CircleHelp,
}

export type IconName = keyof typeof iconMap

export function ArticleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (iconMap as Record<string, typeof Rocket>)[name] ?? Rocket
  return <Icon className={className} strokeWidth={1.75} />
}
