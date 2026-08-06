import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Search,
  Sparkles,
  KanbanSquare,
  Inbox,
  Settings,
  Lightbulb,
  ArrowRight,
  Mail,
  X,
  Pin,
  Wallet,
  CalendarDays,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import {
  categories,
  articles,
  type CategoryId,
  type Article,
  type ArticleCta,
} from './articles'
import { ArticleIcon } from './Illustration'
import { RinseLogo } from '@/components/brand/RinseLogo'
import { useDeskNav } from '@/providers/DeskNavProvider'
import type { PageId } from '@/lib/types'

const categoryIcons: Record<string, LucideIcon> = {
  Sparkles,
  KanbanSquare,
  Inbox,
  Settings,
  Lightbulb,
  Wallet,
  CalendarDays,
  Megaphone,
}

const pageIcons: Partial<Record<PageId, LucideIcon>> = {
  contacts: Search,
  deals: KanbanSquare,
  calendar: CalendarDays,
  chat: Inbox,
  settings: Settings,
  ai: Sparkles,
  invoices: Wallet,
  money: Wallet,
  receipts: Wallet,
  routes: CalendarDays,
  cars: CalendarDays,
  campaigns: Megaphone,
  forms: Megaphone,
  automations: Megaphone,
  activities: Lightbulb,
  dashboard: Sparkles,
}

export function HelpCenter() {
  const { setPage } = useDeskNav()
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all')
  const [activeArticleId, setActiveArticleId] = useState<string>(articles[0]!.id)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredArticles = useMemo(() => {
    let list = articles
    if (activeCategory !== 'all') list = list.filter((a) => a.category === activeCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.body.some(
            (b) =>
              (b.text ?? '').toLowerCase().includes(q) ||
              (b.title ?? '').toLowerCase().includes(q) ||
              (b.items ?? []).some((item) => item.toLowerCase().includes(q)) ||
              (b.chips ?? []).some((chip) => chip.toLowerCase().includes(q)),
          ),
      )
    }
    return list
  }, [activeCategory, query])

  const activeArticle = articles.find((a) => a.id === activeArticleId) ?? articles[0]!
  const noResults = filteredArticles.length === 0
  const visibleArticle =
    filteredArticles.find((a) => a.id === activeArticleId) ?? filteredArticles[0] ?? activeArticle

  useEffect(() => {
    if (noResults) return
    if (!filteredArticles.some((a) => a.id === activeArticleId)) {
      setActiveArticleId(filteredArticles[0]!.id)
    }
  }, [filteredArticles, activeArticleId, noResults])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-ink-100 text-ink-900">
      <div className="shrink-0 border-b border-ink-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-400 transition-colors group-focus-within:text-brand-600" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="h-12 w-full rounded-2xl border border-ink-200 bg-white pl-12 pr-28 text-[14px] text-ink-900 shadow-[0_1px_2px_rgba(16,24,20,0.04)] outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.12)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-500"
              >
                Clear <X className="size-3.5" />
              </button>
            ) : (
              <span className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-[11px] text-ink-400">
                <kbd className="rounded border border-ink-200 bg-ink-100 px-1.5 py-0.5 text-[10px]">⌘</kbd>
                <kbd className="rounded border border-ink-200 bg-ink-100 px-1.5 py-0.5 text-[10px]">K</kbd>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 sm:gap-5 sm:px-6 sm:pb-5 sm:pt-4">
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-ink-200 bg-white sm:w-56 sm:rounded-2xl sm:border sm:shadow-[0_1px_2px_rgba(16,24,20,0.04)]">
          <div className="flex flex-col gap-0.5 border-b border-ink-200 px-2 pb-3 pt-2">
            <RailButton
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              icon={<Sparkles className="size-4" />}
              label="All topics"
              count={articles.length}
            />
            {categories.map((c) => {
              const Icon = categoryIcons[c.icon] ?? Sparkles
              const count = articles.filter((a) => a.category === c.id).length
              return (
                <RailButton
                  key={c.id}
                  active={activeCategory === c.id}
                  onClick={() => setActiveCategory(c.id)}
                  icon={<Icon className="size-4" />}
                  label={c.label}
                  count={count}
                />
              )
            })}
          </div>

          <div className="help-thin-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              {noResults ? 'No matches' : 'Articles'}
            </p>
            {noResults ? (
              <div className="px-2.5 py-6 text-center">
                <p className="text-[12px] text-ink-500">No articles match &ldquo;{query}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700"
                >
                  Clear search <X className="size-3" />
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filteredArticles.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setActiveArticleId(a.id)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] leading-snug transition-all ${
                        visibleArticle.id === a.id
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                      }`}
                    >
                      <span className="flex-1">{a.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="relative min-h-0 flex-1 overflow-hidden sm:rounded-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-help-blob-float absolute -right-16 -top-20 size-80 rounded-full bg-brand-200/45 blur-3xl" />
            <div className="animate-help-blob-float-slow absolute top-1/3 -left-24 size-72 rounded-full bg-brand-100/55 blur-3xl" />
            <div className="animate-help-blob-float absolute -bottom-24 right-1/4 size-72 rounded-full bg-emerald-100/40 blur-3xl" />
          </div>

          <div className="help-thin-scroll relative h-full overflow-y-auto">
            <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-2 sm:py-7">
              {!noResults && (
                <ArticleCard article={visibleArticle} onNavigate={setPage} />
              )}
              <StillNeedHelp onOpenAi={() => setPage('ai')} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function RailButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all ${
        active
          ? 'border border-ink-200 bg-white font-medium text-ink-900 shadow-[0_1px_2px_rgba(16,24,20,0.06)]'
          : 'text-ink-500 hover:bg-ink-50/80 hover:text-ink-900'
      }`}
    >
      <span className={active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-500'}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span className={`tabular-nums text-[10px] ${active ? 'text-ink-500' : 'text-ink-400'}`}>
        {count}
      </span>
    </button>
  )
}

function ArticleCard({
  article,
  onNavigate,
}: {
  article: Article
  onNavigate: (page: PageId) => void
}) {
  const catLabel = categories.find((c) => c.id === article.category)?.label ?? ''
  return (
    <article
      key={article.id}
      className="animate-help-fade-rise overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_1px_3px_rgba(16,24,20,0.05),0_12px_32px_-12px_rgba(16,24,20,0.08)]"
    >
      <div className="relative h-24 overflow-hidden border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="absolute -right-6 -top-6 size-40 rounded-full bg-brand-100/60 blur-2xl" />
        <div className="absolute left-7 top-1/2 flex -translate-y-1/2 items-center gap-4">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-brand-200 bg-white shadow-sm">
            <ArticleIcon name={article.icon} className="size-6 text-brand-600" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-600">
            {catLabel}
          </span>
        </div>
      </div>

      <div className="p-6 pt-5 sm:p-7 sm:pt-5">
        <h2 className="text-[20px] font-semibold leading-tight tracking-tight text-ink-900">
          {article.title}
        </h2>

        <div className="mt-4 flex flex-col gap-3.5">
          {article.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        {article.ctas.length > 0 ? (
          <div className="mt-6 border-t border-ink-200 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Jump into the product
            </p>
            <div className="flex flex-wrap gap-2.5">
              {article.ctas.map((cta) => (
                <CtaButton key={cta.label} cta={cta} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-ink-200 pt-5">
            <p className="inline-flex items-center gap-1.5 text-[12px] text-ink-400">
              <Pin className="size-3.5" />
              No product jump needed — these tips work across every tab.
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function Block({ block }: { block: Article['body'][number] }) {
  if (block.type === 'paragraph') {
    return <p className="text-[14px] leading-[1.65] text-ink-500">{block.text}</p>
  }
  if (block.type === 'steps') {
    return (
      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-ink-900">{block.title}</p>
        <ol className="flex flex-col gap-2.5">
          {block.items?.map((item, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-[1.55] text-ink-500">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10.5px] font-semibold text-brand-700">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
  if (block.type === 'callout') {
    return (
      <div className="flex gap-3 rounded-xl border border-brand-200/70 bg-brand-50/70 px-4 py-3.5">
        <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
        <div>
          <p className="text-[12.5px] font-semibold text-brand-700">{block.title}</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-ink-500">{block.text}</p>
        </div>
      </div>
    )
  }
  if (block.type === 'chip-list') {
    return (
      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-ink-900">{block.title}</p>
        <div className="flex flex-wrap gap-2">
          {block.chips?.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12px] text-ink-500"
            >
              <span className="size-1.5 rounded-full bg-brand-400" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function CtaButton({
  cta,
  onNavigate,
}: {
  cta: ArticleCta
  onNavigate: (page: PageId) => void
}) {
  const Icon = pageIcons[cta.page] ?? ArrowRight
  const primary =
    'bg-brand-600 hover:bg-brand-700 text-white border-brand-600 shadow-[0_1px_2px_rgba(22,163,74,0.3),0_8px_20px_-8px_rgba(22,163,74,0.4)]'
  const outline =
    'bg-white hover:bg-brand-50 text-brand-700 border-brand-200 hover:border-brand-300'
  return (
    <button
      type="button"
      onClick={() => onNavigate(cta.page)}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all active:scale-[0.98] ${
        cta.variant === 'primary' ? primary : outline
      }`}
    >
      <Icon className="size-4" />
      {cta.label}
      <ArrowRight className="size-3.5 opacity-70" />
    </button>
  )
}

function StillNeedHelp({ onOpenAi }: { onOpenAi: () => void }) {
  return (
    <div className="animate-help-fade-in flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-ink-200 bg-white/80 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 p-1.5">
          <RinseLogo size={28} />
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-ink-900">Still need help?</p>
          <p className="text-[12px] text-ink-500">Email the Rinse team — we reply within one business day.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <a
          href="mailto:support@rinse.com?subject=Rinse%20Desk%20help"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-600 bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(22,163,74,0.3)] transition-all hover:bg-brand-700 active:scale-[0.98]"
        >
          <Mail className="size-4" /> Email support
        </a>
        <button
          type="button"
          onClick={onOpenAi}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-[13px] font-medium text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98]"
        >
          <Sparkles className="size-4" /> Open AI Assist
        </button>
      </div>
    </div>
  )
}
