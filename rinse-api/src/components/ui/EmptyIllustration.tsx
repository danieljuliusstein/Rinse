export type EmptyIllustrationKind =
  | 'jobs'
  | 'invoices'
  | 'pipeline'
  | 'messages'
  | 'damage'
  | 'inventory'
  | 'quotes'
  | 'clients'
  | 'photos'

interface EmptyIllustrationProps {
  kind: EmptyIllustrationKind
}

/** Lightweight inline SVG illustrations for empty states */
export default function EmptyIllustration({ kind }: EmptyIllustrationProps) {
  return (
    <svg
      className="ui-empty-illustration"
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="12" width="104" height="72" rx="14" className="ui-empty-illustration__card" />
      {kind === 'jobs' && (
        <>
          <rect x="24" y="28" width="48" height="8" rx="4" className="ui-empty-illustration__line" />
          <rect x="24" y="44" width="72" height="6" rx="3" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
          <circle cx="88" cy="58" r="14" className="ui-empty-illustration__accent" />
          <path d="M82 58h12M88 52v12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === 'invoices' && (
        <>
          <rect x="28" y="24" width="64" height="48" rx="6" className="ui-empty-illustration__doc" />
          <rect x="36" y="34" width="32" height="5" rx="2.5" className="ui-empty-illustration__line" />
          <rect x="36" y="44" width="48" height="4" rx="2" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
          <rect x="36" y="52" width="40" height="4" rx="2" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
          <rect x="60" y="62" width="24" height="6" rx="3" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'pipeline' && (
        <>
          <rect x="20" y="26" width="24" height="44" rx="8" className="ui-empty-illustration__pill" />
          <rect x="48" y="26" width="24" height="44" rx="8" className="ui-empty-illustration__pill ui-empty-illustration__pill--on" />
          <rect x="76" y="26" width="24" height="44" rx="8" className="ui-empty-illustration__pill" />
          <circle cx="60" cy="38" r="5" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'messages' && (
        <>
          <rect x="22" y="30" width="56" height="28" rx="10" className="ui-empty-illustration__bubble" />
          <rect x="42" y="50" width="56" height="28" rx="10" className="ui-empty-illustration__bubble ui-empty-illustration__bubble--alt" />
          <circle cx="34" cy="44" r="3" className="ui-empty-illustration__dot" />
          <circle cx="44" cy="44" r="3" className="ui-empty-illustration__dot" />
          <circle cx="54" cy="44" r="3" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'damage' && (
        <>
          <rect x="30" y="22" width="60" height="44" rx="8" className="ui-empty-illustration__photo" />
          <path d="M38 54 L52 38 L64 48 L78 32" className="ui-empty-illustration__stroke" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="72" cy="30" r="6" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'inventory' && (
        <>
          <rect x="26" y="28" width="28" height="36" rx="6" className="ui-empty-illustration__box" />
          <rect x="58" y="34" width="28" height="30" rx="6" className="ui-empty-illustration__box ui-empty-illustration__box--alt" />
          <rect x="38" y="38" width="8" height="16" rx="2" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'quotes' && (
        <>
          <rect x="28" y="24" width="64" height="48" rx="6" className="ui-empty-illustration__doc" />
          <rect x="36" y="34" width="20" height="5" rx="2.5" className="ui-empty-illustration__accent" />
          <rect x="36" y="44" width="48" height="4" rx="2" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
          <rect x="36" y="52" width="36" height="4" rx="2" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
        </>
      )}
      {kind === 'clients' && (
        <>
          <circle cx="46" cy="40" r="12" className="ui-empty-illustration__avatar" />
          <circle cx="74" cy="40" r="12" className="ui-empty-illustration__avatar ui-empty-illustration__avatar--alt" />
          <rect x="28" y="58" width="64" height="6" rx="3" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
          <rect x="40" y="68" width="40" height="6" rx="3" className="ui-empty-illustration__accent" />
        </>
      )}
      {kind === 'photos' && (
        <>
          <rect x="30" y="22" width="60" height="44" rx="8" className="ui-empty-illustration__photo" />
          <circle cx="72" cy="30" r="6" className="ui-empty-illustration__accent" />
          <rect x="42" y="56" width="36" height="6" rx="3" className="ui-empty-illustration__line ui-empty-illustration__line--muted" />
        </>
      )}
    </svg>
  )
}
