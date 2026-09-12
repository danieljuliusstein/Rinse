'use client'

import { Image as ImageIcon } from '@phosphor-icons/react'
import { LOGO_ACCEPT } from '@/lib/logo-upload'

export interface LogoMeta {
  width: number
  height: number
  format: string
}

interface LogoSectionProps {
  logoSrc: string | null
  businessName: string
  logoMeta?: LogoMeta | null
  uploading?: boolean
  removing?: boolean
  error?: string | null
  inputId: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveLogo: () => void
}

function metaSubline(
  logoSrc: string | null,
  logoMeta: LogoMeta | null | undefined,
  uploading: boolean,
): string {
  if (uploading) return 'Uploading…'
  if (!logoSrc) return 'No logo uploaded'
  if (logoMeta && logoMeta.width > 0 && logoMeta.height > 0) {
    return `${logoMeta.format.toUpperCase()} · ${logoMeta.width} × ${logoMeta.height}`
  }
  if (logoMeta?.format) return logoMeta.format.toUpperCase()
  return 'Logo uploaded'
}

export default function LogoSection({
  logoSrc,
  businessName,
  logoMeta,
  uploading = false,
  removing = false,
  error,
  inputId,
  onFileChange,
  onRemoveLogo,
}: LogoSectionProps) {
  const showRemove = Boolean(logoSrc) && !uploading

  return (
    <div className="settings-logo-card card">
      <div className="settings-logo-card__top">
        <div className={`settings-logo-card__thumb${uploading ? ' settings-logo-card__thumb--busy' : ''}`}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="settings-logo-card__thumb-img" />
          ) : (
            <div className="settings-logo-card__thumb-placeholder" aria-hidden="true">
              <ImageIcon size={22} weight="duotone" />
            </div>
          )}
          {uploading ? <span className="settings-logo-card__thumb-overlay" aria-hidden="true" /> : null}
        </div>

        <div className="settings-logo-card__meta">
          <p className="settings-logo-card__name">{businessName.trim() || 'Your business'}</p>
          <p className="settings-logo-card__sub">{metaSubline(logoSrc, logoMeta, uploading)}</p>
        </div>

        <label
          htmlFor={inputId}
          className={`settings-logo-card__change${uploading ? ' settings-logo-card__change--busy' : ''}`}
          aria-label="Change logo"
        >
          {uploading ? 'Saving…' : 'Change'}
        </label>
        <input
          id={inputId}
          type="file"
          accept={LOGO_ACCEPT}
          className="settings-file-input"
          aria-labelledby={`${inputId}-label`}
          disabled={uploading}
          onChange={onFileChange}
        />
      </div>

      <div className="settings-logo-card__divider" />

      <div className="settings-logo-card__bottom">
        <p className="settings-logo-card__helper">
          Shown on invoices, your booking page, and the client portal.
        </p>
        {showRemove ? (
          <button
            type="button"
            className="settings-logo-card__remove"
            onClick={onRemoveLogo}
            disabled={removing}
          >
            {removing ? 'Removing…' : 'Remove logo'}
          </button>
        ) : null}
        {error ? <p className="settings-logo-card__error">{error}</p> : null}
      </div>
    </div>
  )
}

export async function logoMetaFromFile(file: File): Promise<LogoMeta> {
  const ext = file.name.split('.').pop()?.toUpperCase()
  const format =
    file.type.split('/')[1]?.toUpperCase() || ext || 'IMG'

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format,
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0, format })
    }
    img.src = url
  })
}

export async function logoMetaFromUrl(src: string): Promise<LogoMeta | null> {
  if (!src || src.startsWith('blob:')) return null
  const ext = src.split('?')[0].split('.').pop()?.toUpperCase()

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: ext || 'IMG',
      })
    }
    img.onerror = () => resolve(ext ? { width: 0, height: 0, format: ext } : null)
    img.src = src
  })
}
