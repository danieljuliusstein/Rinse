'use client'

import type { Package } from '@/lib/types'

interface PackagePickerGridProps {
  packages: Package[]
  value: string
  onChange: (pkg: Package) => void
}

export function PackagePickerGrid({ packages, value, onChange }: PackagePickerGridProps) {
  return (
    <div className="job-form-package-grid">
      {packages.map((pkg) => {
        const active = value === pkg.id
        return (
          <button
            key={pkg.id}
            type="button"
            className={`job-form-package-card${active ? ' job-form-package-card--on' : ''}`}
            onClick={() => onChange(pkg)}
          >
            <div className="job-form-package-card__name">{pkg.name}</div>
            <div className="job-form-package-card__price">from ${pkg.base_price}</div>
          </button>
        )
      })}
    </div>
  )
}
