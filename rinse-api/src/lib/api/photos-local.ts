import { loadData, newId, saveData } from '../storage'
import { isJobPhotoTypeAtLimit, jobPhotoLimitMessage } from '../job-photo-limits'
import type { JobPhoto, PhotoType } from '../types'

export function getJobPhotos(jobId: string): JobPhoto[] {
  const data = loadData()
  const photos = data.job_photos[jobId] ?? []
  return photos.map((p) => ({
    filename: p.id,
    url: p.data_url,
    type: p.type,
  }))
}

export async function uploadJobPhoto(
  jobId: string,
  file: File,
  type: PhotoType
): Promise<JobPhoto> {
  const data = loadData()
  const existing = data.job_photos[jobId] ?? []
  const typeCount = existing.filter((p) => p.type === type).length
  if (isJobPhotoTypeAtLimit(typeCount)) {
    throw new Error(jobPhotoLimitMessage(type))
  }

  const dataUrl = await readFileAsDataUrl(file)
  const photo = { id: newId(), data_url: dataUrl, type }
  if (!data.job_photos[jobId]) data.job_photos[jobId] = []
  data.job_photos[jobId].push(photo)

  const job = data.jobs.find((j) => j.id === jobId)
  if (job) {
    job.photo_count = data.job_photos[jobId].length
    job.updated = new Date().toISOString()
  }

  saveData(data)
  return { filename: photo.id, url: photo.data_url, type: photo.type }
}

export function deleteJobPhoto(jobId: string, filename: string): void {
  const data = loadData()
  const photos = data.job_photos[jobId] ?? []
  data.job_photos[jobId] = photos.filter((p) => p.id !== filename)

  const job = data.jobs.find((j) => j.id === jobId)
  if (job) {
    job.photo_count = data.job_photos[jobId].length
    job.updated = new Date().toISOString()
  }

  saveData(data)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
