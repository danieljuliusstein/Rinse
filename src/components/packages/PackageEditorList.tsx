'use client'

import { SetupMoneyRow, SetupStackField } from '@/components/forms'
import { fmt } from '@/lib/calculations'
import type { Package } from '@/lib/types'

export interface PackageDraft {
  id: string
  name: string
  price: number
  description: string
}

interface PackageEditorListProps {
  packages: Package[]
  drafts?: Record<string, PackageDraft>
  onDraftChange?: (id: string, patch: Partial<PackageDraft>) => void
  compact?: boolean
}

export function packagesToDrafts(packages: Package[]): Record<string, PackageDraft> {
  return Object.fromEntries(
    packages.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        price: p.base_price,
        description: p.description ?? '',
      },
    ]),
  )
}

export default function PackageEditorList({
  packages,
  drafts = {},
  onDraftChange = () => {},
  compact = false,
}: PackageEditorListProps) {
  if (!packages.length) {
    return <p className="onboarding-step__lead">Default services will appear after sync.</p>
  }

  return (
    <div className={compact ? 'ob-menu-group' : 'ob-service-list'}>
      {packages.map((pkg) => {
        const draft = drafts[pkg.id] ?? {
          id: pkg.id,
          name: pkg.name,
          price: pkg.base_price,
          description: pkg.description ?? '',
        }
        if (compact) {
          return (
            <div key={pkg.id} className="onboarding-package-row">
              <div>
                <strong>{draft.name || pkg.name}</strong>
                {draft.description ? (
                  <p className="onboarding-step__lead">{draft.description}</p>
                ) : null}
              </div>
              <span>{fmt(draft.price || pkg.base_price)}</span>
            </div>
          )
        }
        return (
          <div key={pkg.id} className="ob-service-card">
            <SetupStackField
              id={`pkg-name-${pkg.id}`}
              label="Service name"
              value={draft.name}
              onChange={(e) => onDraftChange(pkg.id, { name: e.target.value })}
            />
            <div className="ob-service-card__money">
              <SetupMoneyRow
                id={`pkg-price-${pkg.id}`}
                label="Price"
                value={draft.price || ''}
                onChange={(e) => onDraftChange(pkg.id, { price: Number(e.target.value) })}
              />
            </div>
            <SetupStackField
              id={`pkg-desc-${pkg.id}`}
              label="Description"
              value={draft.description}
              onChange={(e) => onDraftChange(pkg.id, { description: e.target.value })}
              optional
            />
          </div>
        )
      })}
    </div>
  )
}
