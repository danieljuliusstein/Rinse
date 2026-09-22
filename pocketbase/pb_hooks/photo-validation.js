/// Security Wave 7 — reject non-image uploads on jobs.photos (magic bytes + extension).
/// Photo uploads use PATCH with photos+ (onRecordUpdateRequest); create is included for completeness.

function readHeadBytes(file, maxLen) {
  if (!file || !file.reader) return null
  try {
    const rc = file.reader.open()
    // rc.read() follows Go's io.Reader convention exposed to the JSVM: it
    // fills a []uint8 buffer passed in and returns the byte count, it does
    // NOT take a length and return a slice (rc.read(maxLen) throws
    // "could not convert 12 to []uint8" — confirmed empirically). That
    // exception was being swallowed by the catch below, so every real photo
    // upload was silently treated as a magic-byte mismatch and rejected.
    const buf = new Uint8Array(maxLen)
    const n = rc.read(buf)
    rc.close()
    return n > 0 ? buf.subarray(0, n) : null
  } catch (err) {
    console.warn('jobs_photo_validate: could not read file head', err)
    return null
  }
}

function matchesImageMagic(head) {
  if (!head || head.length < 4) return false
  // JPEG
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true
  // PNG
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true
  // GIF
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38) return true
  // WebP (RIFF....WEBP)
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return true
  }
  return false
}

function hasAllowedImageExtension(name) {
  return /\.(jpe?g|png|gif|webp)$/i.test(String(name || ''))
}

function validatePhotoFile(file) {
  if (!file) return
  const label = String(file.originalName || file.name || 'upload')
  const head = readHeadBytes(file, 12)
  if (head && matchesImageMagic(head)) return
  if (hasAllowedImageExtension(label)) {
    console.warn('jobs_photo_validate: extension ok but magic bytes mismatch:', label)
  }
  throw new BadRequestError('Job photos must be JPEG, PNG, GIF, or WebP images')
}

function validateUploadedPhotos(e) {
  const keys = ['photos', 'photos+']
  for (let i = 0; i < keys.length; i++) {
    let files
    try { files = e.findUploadedFiles(keys[i]) } catch { continue }
    if (!files || files.length === 0) continue
    for (let j = 0; j < files.length; j++) {
      validatePhotoFile(files[j])
    }
  }

  const record = e.record
  if (record && typeof record.getUnsavedFiles === 'function') {
    const unsaved = record.getUnsavedFiles('photos')
    if (unsaved && unsaved.length > 0) {
      for (let k = 0; k < unsaved.length; k++) {
        validatePhotoFile(unsaved[k])
      }
    }
  }
}


exports.validateUploadedPhotos = validateUploadedPhotos
