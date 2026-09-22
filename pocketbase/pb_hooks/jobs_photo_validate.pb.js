onRecordUpdateRequest((e) => {
  require(__hooks + '/photo-validation.js').validateUploadedPhotos(e)
  e.next()
}, 'jobs')

onRecordCreateRequest((e) => {
  require(__hooks + '/photo-validation.js').validateUploadedPhotos(e)
  e.next()
}, 'jobs')
