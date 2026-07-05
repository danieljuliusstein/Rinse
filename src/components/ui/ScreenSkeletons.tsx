import Skeleton from './Skeleton'

export function JobCardSkeleton({ stagger = 0 }: { stagger?: number }) {
  return (
    <div className="skeleton-job-card" style={{ ['--skeleton-stagger' as string]: `${stagger * 55}ms` }}>
      <Skeleton width={40} height={40} radius="50%" />
      <div className="skeleton-job-card__body">
        <Skeleton width="58%" height={14} radius={6} />
        <Skeleton width="42%" height={11} radius={5} />
      </div>
      <Skeleton width={52} height={14} radius={5} />
    </div>
  )
}

export function ClientCardSkeleton({ stagger = 0 }: { stagger?: number }) {
  return (
    <div className="skeleton-client-card" style={{ ['--skeleton-stagger' as string]: `${stagger * 55}ms` }}>
      <Skeleton width={44} height={44} radius="50%" />
      <div className="skeleton-client-card__body">
        <Skeleton width="50%" height={14} radius={6} />
        <Skeleton width="36%" height={11} radius={5} />
      </div>
      <Skeleton width={48} height={14} radius={5} />
    </div>
  )
}

export function ListRowSkeleton({ stagger = 0 }: { stagger?: number }) {
  return (
    <div className="skeleton-list-row" style={{ ['--skeleton-stagger' as string]: `${stagger * 55}ms` }}>
      <Skeleton width="55%" height={14} radius={6} />
      <Skeleton width={64} height={12} radius={5} />
    </div>
  )
}

export function ScreenHeaderSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`page-header${compact ? ' page-header--compact' : ''} skeleton-screen-header`}>
      <div>
        <Skeleton width={compact ? 140 : 180} height={compact ? 22 : 28} radius={8} />
        {!compact ? <Skeleton width={120} height={12} radius={5} className="skeleton-screen-header__sub" /> : null}
      </div>
    </header>
  )
}

export function ListScreenSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-screen skeleton-screen--list">
      <ScreenHeaderSkeleton />
      <Skeleton width="100%" height={40} radius={12} className="skeleton-screen__search" />
      <div className="skeleton-screen__chips">
        <Skeleton width={56} height={30} radius={999} />
        <Skeleton width={72} height={30} radius={999} />
        <Skeleton width={64} height={30} radius={999} />
      </div>
      <div className="skeleton-screen__rows">
        {Array.from({ length: rows }, (_, i) => (
          <JobCardSkeleton key={i} stagger={i + 1} />
        ))}
      </div>
    </div>
  )
}

export function DetailScreenSkeleton() {
  return (
    <div className="skeleton-screen skeleton-screen--detail">
      <ScreenHeaderSkeleton compact />
      <Skeleton width="100%" height={120} radius={16} className="skeleton-screen__card" stagger={1} />
      <Skeleton width="100%" height={88} radius={16} className="skeleton-screen__card" stagger={2} />
      <div className="skeleton-screen__rows">
        {Array.from({ length: 4 }, (_, i) => (
          <ListRowSkeleton key={i} stagger={i + 3} />
        ))}
      </div>
    </div>
  )
}

export function SettingsScreenSkeleton() {
  return (
    <div className="skeleton-screen skeleton-screen--settings">
      <ScreenHeaderSkeleton compact />
      <Skeleton width="100%" height={40} radius={12} className="skeleton-screen__search" />
      <div className="skeleton-screen__group">
        <Skeleton width={80} height={10} radius={4} className="skeleton-screen__section-label" />
        <div className="skeleton-screen__card-block">
          {Array.from({ length: 5 }, (_, i) => (
            <ListRowSkeleton key={i} stagger={i + 1} />
          ))}
        </div>
      </div>
      <div className="skeleton-screen__group">
        <Skeleton width={96} height={10} radius={4} className="skeleton-screen__section-label" />
        <div className="skeleton-screen__card-block">
          {Array.from({ length: 3 }, (_, i) => (
            <ListRowSkeleton key={i} stagger={i + 6} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function HomeScreenSkeleton() {
  return (
    <div className="skeleton-screen skeleton-screen--home">
      <header className="page-header skeleton-screen-header">
        <div>
          <Skeleton width={160} height={26} radius={8} />
          <Skeleton width={200} height={12} radius={5} className="skeleton-screen-header__sub" />
        </div>
      </header>
      <Skeleton width="100%" height={72} radius={16} className="skeleton-screen__card" stagger={1} />
      <Skeleton width="100%" height={140} radius={16} className="skeleton-screen__card" stagger={2} />
      <Skeleton width={100} height={11} radius={4} className="skeleton-screen__section-label" stagger={3} />
      <div className="skeleton-screen__rows">
        {Array.from({ length: 3 }, (_, i) => (
          <JobCardSkeleton key={i} stagger={i + 4} />
        ))}
      </div>
    </div>
  )
}

export function InlineScreenSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-screen skeleton-screen--inline" role="status" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => (
        <ListRowSkeleton key={i} stagger={i} />
      ))}
    </div>
  )
}

export function InventoryHomeSkeleton() {
  return (
    <div className="skeleton-screen skeleton-screen--inventory">
      <ScreenHeaderSkeleton />
      <div className="skeleton-inventory-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="skeleton-inventory-grid__cell" height={88} radius={16} stagger={i + 1} />
        ))}
      </div>
    </div>
  )
}
