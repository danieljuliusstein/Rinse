'use client'

import InvoiceTemplateGallery from './InvoiceTemplateGallery'
import InvoiceTemplateMock from './InvoiceTemplateMock'
import { isValidHexColor, normalizeAccentColor } from '@/lib/brand-color'
import type { InvoiceTemplateId } from '@/lib/invoice-templates'

const ACCENT_PRESETS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9']

interface InvoiceAppearancePickerProps {
  template: InvoiceTemplateId
  accent: string
  businessName: string
  logoUrl?: string
  onTemplateChange: (template: InvoiceTemplateId) => void
  onAccentChange: (accent: string) => void
  showPreview?: boolean
  /** Onboarding: preview only, no template gallery or accent controls */
  previewOnly?: boolean
}

export default function InvoiceAppearancePicker({
  template,
  accent,
  businessName,
  logoUrl,
  onTemplateChange,
  onAccentChange,
  showPreview = true,
  previewOnly = false,
}: InvoiceAppearancePickerProps) {
  const normalizedAccent = normalizeAccentColor(accent)

  if (previewOnly) {
    return (
      <div className="onboarding-invoice-appearance">
        <div className="onboarding-invoice-preview">
          <InvoiceTemplateMock
            template={template}
            accent={normalizedAccent}
            businessName={businessName}
            logoUrl={logoUrl}
            scale="full"
          />
        </div>
      </div>
    )
  }

  return (
      <div className="onboarding-invoice-appearance">
      <InvoiceTemplateGallery
        value={template}
        onChange={onTemplateChange}
        accent={normalizedAccent}
        businessName={businessName}
        logoUrl={logoUrl}
      />

      <div className="ob-field-group" style={{ marginTop: 16, padding: '14px 16px' }}>
        <p className="cl-label" style={{ marginBottom: 10 }}>Accent color</p>
        <div className="invoice-accent-presets">
          {ACCENT_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`invoice-accent-swatch${
                normalizedAccent === hex ? ' invoice-accent-swatch--on' : ''
              }`}
              style={{ backgroundColor: hex }}
              aria-label={`Accent ${hex}`}
              onClick={() => onAccentChange(hex)}
            />
          ))}
        </div>
        <div className="settings-accent-row" style={{ marginTop: 12 }}>
          <input
            type="color"
            className="settings-accent-swatch-input"
            value={isValidHexColor(normalizedAccent) ? normalizedAccent : '#22c55e'}
            aria-label="Custom accent color"
            onChange={(e) => onAccentChange(e.target.value)}
          />
          <span className="settings-accent-hex">{normalizedAccent}</span>
        </div>
      </div>

      {showPreview ? (
        <div style={{ marginTop: 16 }}>
          <p className="cl-label">Preview</p>
          <div className="onboarding-invoice-preview">
            <InvoiceTemplateMock
              template={template}
              accent={normalizedAccent}
              businessName={businessName}
              logoUrl={logoUrl}
              scale="full"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
