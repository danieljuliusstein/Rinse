import { describe, expect, it } from 'vitest'
import { LOGO_MAX_BYTES, validateLogoFile } from './logo-upload'

describe('validateLogoFile', () => {
  it('accepts allowed image types within size limit', () => {
    const file = new File([new Uint8Array(100)], 'logo.png', { type: 'image/png' })
    expect(validateLogoFile(file)).toBeNull()
  })

  it('rejects unsupported types', () => {
    const file = new File([new Uint8Array(100)], 'logo.svg', { type: 'image/svg+xml' })
    expect(validateLogoFile(file)).toMatch(/JPG/i)
  })

  it('rejects oversized files', () => {
    const file = new File([new Uint8Array(LOGO_MAX_BYTES + 1)], 'logo.jpg', { type: 'image/jpeg' })
    expect(validateLogoFile(file)).toMatch(/5 MB/i)
  })
})
