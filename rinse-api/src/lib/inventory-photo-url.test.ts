import { describe, expect, it } from 'vitest'
import { pocketBasePhotoFilename } from './inventory-photo-url'

describe('inventory-photo-url', () => {
  it('pocketBasePhotoFilename accepts string or array', () => {
    expect(pocketBasePhotoFilename('thumb_abc.jpg')).toBe('thumb_abc.jpg')
    expect(pocketBasePhotoFilename(['thumb_abc.jpg'])).toBe('thumb_abc.jpg')
    expect(pocketBasePhotoFilename('')).toBeUndefined()
    expect(pocketBasePhotoFilename([])).toBeUndefined()
    expect(pocketBasePhotoFilename(null)).toBeUndefined()
  })
})
