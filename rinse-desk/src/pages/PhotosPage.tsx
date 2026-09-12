import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { EmptyState } from '@/components/graphics/SoftBlobs'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { CarDamageMap } from '@/components/photos/CarDamageMap'
import {
  deleteJobPhoto,
  getJobPhotos,
  uploadJobPhoto,
  type JobPhoto,
  type PhotoType,
} from '@/lib/job-photos-api'
import { countJobPhotosByType } from '@/lib/job-photos'
import { getDamageDocsForJob, type DeskDamageDoc } from '@/lib/damage-docs-api'
import type { DeskJob } from '@/lib/types'
import { colors } from '@/theme/colors'

type Filter = 'all' | PhotoType | 'damage'

type GalleryItem =
  | { kind: 'job'; photo: JobPhoto }
  | { kind: 'damage'; doc: DeskDamageDoc }

function jobLabel(job: DeskJob): string {
  const client = job.client?.name?.trim() || 'Client'
  const pkg = job.packageName?.trim() || 'Job'
  return `${client} · ${pkg}`
}

function jobSearchBlob(job: DeskJob): string {
  return [
    job.client?.name,
    job.packageName,
    job.date,
    job.notes,
    job.status,
    job.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function PhotosPage() {
  const { jobs } = useData()
  const [query, setQuery] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [damageDocs, setDamageDocs] = useState<DeskDamageDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)
  const [uploadType, setUploadType] = useState<PhotoType>('after')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [selectedDamageArea, setSelectedDamageArea] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...jobs].sort((a, b) => b.date.localeCompare(a.date))
    if (!q) return list
    return list.filter((j) => jobSearchBlob(j).includes(q))
  }, [jobs, query])

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  )

  const refreshGallery = useCallback(async (jobId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [jobPhotos, docs] = await Promise.all([
        getJobPhotos(jobId),
        getDamageDocsForJob(jobId).catch(() => [] as DeskDamageDoc[]),
      ])
      setPhotos(jobPhotos)
      setDamageDocs(docs)
    } catch (err) {
      setPhotos([])
      setDamageDocs([])
      setError(err instanceof Error ? err.message : 'Could not load photos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedJobId) {
      setPhotos([])
      setDamageDocs([])
      setSelectedDamageArea(null)
      setError(null)
      return
    }
    setSelectedDamageArea(null)
    void refreshGallery(selectedJobId)
  }, [selectedJobId, refreshGallery])

  const jobCounts = useMemo(() => countJobPhotosByType(photos), [photos])
  const damageWithPhoto = useMemo(
    () => damageDocs.filter((d) => !!d.photo_url),
    [damageDocs],
  )
  const markedDamageAreas = useMemo(
    () => [...new Set(damageDocs.map((d) => d.area).filter(Boolean))],
    [damageDocs],
  )

  const damageItems = useMemo(() => {
    const all = damageWithPhoto.map((doc) => ({ kind: 'damage' as const, doc }))
    if (!selectedDamageArea) return all
    return all.filter((item) => item.doc.area === selectedDamageArea)
  }, [damageWithPhoto, selectedDamageArea])

  const items = useMemo((): GalleryItem[] => {
    const jobItems: GalleryItem[] = photos.map((photo) => ({ kind: 'job', photo }))
    if (filter === 'all') return [...jobItems, ...damageWithPhoto.map((doc) => ({ kind: 'damage' as const, doc }))]
    if (filter === 'damage') return damageItems
    return jobItems.filter((item) => item.kind === 'job' && item.photo.type === filter)
  }, [photos, damageWithPhoto, damageItems, filter])

  const effectiveUploadType: PhotoType | null =
    filter === 'before' || filter === 'after' ? filter : uploadType

  const canUpload = filter !== 'damage'

  async function onUploadFiles(fileList: FileList | null) {
    if (!selectedJobId || !fileList?.length || !canUpload) return
    if (filter === 'all' && !effectiveUploadType) return

    const type = effectiveUploadType!
    const files = Array.from(fileList)
    setUploading(true)
    setError(null)
    const failures: string[] = []
    let done = 0

    for (const file of files) {
      setUploadProgress(`Uploading ${done + 1} of ${files.length}…`)
      try {
        await uploadJobPhoto(selectedJobId, file, type)
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'failed'}`)
      }
      done += 1
    }

    await refreshGallery(selectedJobId)
    setUploading(false)
    setUploadProgress('')
    if (fileRef.current) fileRef.current.value = ''
    if (failures.length) {
      setError(
        failures.length === files.length
          ? failures.join(' · ')
          : `Some uploads failed: ${failures.join(' · ')}`,
      )
    }
  }

  async function onDeleteJobPhoto(photo: JobPhoto) {
    if (!selectedJobId) return
    if (!window.confirm('Delete this photo? It will also disappear on mobile.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteJobPhoto(selectedJobId, photo.filename)
      if (lightbox?.kind === 'job' && lightbox.photo.filename === photo.filename) {
        setLightbox(null)
      }
      await refreshGallery(selectedJobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete photo')
    } finally {
      setDeleting(false)
    }
  }

  function openFilePicker() {
    if (!canUpload) return
    if (filter === 'all' && !uploadType) return
    fileRef.current?.click()
  }

  const galleryEmpty = photos.length === 0 && damageWithPhoto.length === 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Photos" subtitle="Before / after / damage · desk fill-in upload" />
      <div className="flex-1 overflow-hidden p-5">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0">
          <aside className="bg-white rounded-xl border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={uploading}
                placeholder="Search jobs…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No jobs yet" description="Create a job from Calendar or Deals first." />
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-sm text-gray-600">No jobs match your search</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700"
                    onClick={() => setQuery('')}
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const on = job.id === selectedJobId
                  return (
                    <button
                      key={job.id}
                      type="button"
                      disabled={uploading}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left px-3 py-2.5 border-b border-gray-50 ${
                        on ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-800 truncate">{jobLabel(job)}</p>
                      <p className="text-[11px] text-gray-400">
                        {job.date} · {job.status}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="bg-white rounded-xl border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            {!selectedJob ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <EmptyState title="Pick a job" description="Select a job on the left to browse its gallery." />
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{jobLabel(selectedJob)}</p>
                    <p className="text-xs text-gray-400">
                      {jobCounts.before} before · {jobCounts.after} after · {damageWithPhoto.length}{' '}
                      damage
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'before', 'after', 'damage'] as Filter[]).map((f) => {
                      const count =
                        f === 'all'
                          ? jobCounts.total + damageWithPhoto.length
                          : f === 'before'
                            ? jobCounts.before
                            : f === 'after'
                              ? jobCounts.after
                              : damageWithPhoto.length
                      return (
                        <button
                          key={f}
                          type="button"
                          disabled={uploading}
                          onClick={() => setFilter(f)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            filter === f
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          {f === 'all'
                            ? 'All'
                            : f === 'before'
                              ? 'Before'
                              : f === 'after'
                                ? 'After'
                                : 'Damage'}
                          <span className={`ml-1 ${filter === f ? 'text-white/70' : 'text-gray-400'}`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                    {filter === 'all' && (
                      <select
                        value={uploadType}
                        disabled={uploading}
                        onChange={(e) => setUploadType(e.target.value as PhotoType)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                        aria-label="Upload type"
                      >
                        <option value="before">Upload as before</option>
                        <option value="after">Upload as after</option>
                      </select>
                    )}
                    {canUpload && (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={openFilePicker}
                        className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        style={{ background: colors.green }}
                      >
                        {uploading ? uploadProgress || 'Uploading…' : 'Upload'}
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => void onUploadFiles(e.target.files)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mx-4 mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading photos…</p>
                  ) : filter === 'damage' ? (
                    <div className="rounded-xl border border-gray-100 bg-[var(--color-rinse-bg,#F4F5F3)] px-4 py-5">
                      <div className="flex flex-col items-center">
                        <CarDamageMap
                          selectedArea={selectedDamageArea}
                          onSelectArea={setSelectedDamageArea}
                          markedAreas={markedDamageAreas}
                        />
                        {!selectedDamageArea && (
                          <p className="text-[11px] text-gray-400 mt-3 text-center">
                            {damageWithPhoto.length === 0
                              ? 'No damage photos linked to this job yet · docs from mobile appear as orange pins'
                              : `${markedDamageAreas.length} area${markedDamageAreas.length === 1 ? '' : 's'} marked · tap a pin to view photos`}
                          </p>
                        )}
                      </div>
                      {selectedDamageArea ? (
                        <div className="mt-4 pt-4 border-t border-gray-200/80">
                          <p className="text-xs text-gray-400 mb-3 text-center">
                            {damageItems.length === 0
                              ? `No photos for ${selectedDamageArea}`
                              : `${damageItems.length} photo${damageItems.length === 1 ? '' : 's'} · ${selectedDamageArea}`}
                          </p>
                          {damageItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                              {damageItems.map((item) => (
                                <div key={`damage-${item.doc.id}`} className="group relative">
                                  <button
                                    type="button"
                                    className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-white"
                                    onClick={() => setLightbox(item)}
                                  >
                                    <img
                                      src={item.doc.photo_url!}
                                      alt={item.doc.area || 'Damage'}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                  <span className="absolute left-2 bottom-2 text-[10px] font-semibold bg-amber-700/90 text-white px-1.5 py-0.5 rounded max-w-[90%] truncate">
                                    {item.doc.area || 'damage'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : galleryEmpty ? (
                    <EmptyState
                      title="No photos yet"
                      description="Upload before/after shots from Desk, or capture them on mobile. Damage docs linked to this job appear under Damage."
                      action={
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={openFilePicker}
                          className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                          style={{ background: colors.green }}
                        >
                          Upload photos
                        </button>
                      }
                    />
                  ) : items.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <p className="text-sm text-gray-700">No {filter} photos for this job</p>
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={openFilePicker}
                        className="text-xs font-semibold text-emerald-700"
                      >
                        Upload {filter === 'before' ? 'before' : 'after'} photos
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {items.map((item) =>
                        item.kind === 'job' ? (
                          <div key={`job-${item.photo.filename}`} className="group relative">
                            <button
                              type="button"
                              className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                              onClick={() => setLightbox(item)}
                            >
                              <img
                                src={item.photo.url}
                                alt={`${item.photo.type} ${item.photo.filename}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <span className="absolute left-2 bottom-2 text-[10px] font-semibold bg-black/55 text-white px-1.5 py-0.5 rounded">
                              {item.photo.type}
                            </span>
                            <button
                              type="button"
                              disabled={uploading || deleting}
                              onClick={() => void onDeleteJobPhoto(item.photo)}
                              className="absolute right-2 top-2 text-[10px] font-semibold bg-white/90 text-red-600 border border-red-100 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div key={`damage-${item.doc.id}`} className="group relative">
                            <button
                              type="button"
                              className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                              onClick={() => setLightbox(item)}
                            >
                              <img
                                src={item.doc.photo_url!}
                                alt={item.doc.area || 'Damage'}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <span className="absolute left-2 bottom-2 text-[10px] font-semibold bg-amber-700/90 text-white px-1.5 py-0.5 rounded max-w-[90%] truncate">
                              {item.doc.area || 'damage'}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <PhotoLightbox
        open={!!lightbox}
        title={
          lightbox?.kind === 'job'
            ? `${lightbox.photo.type} · ${lightbox.photo.filename}`
            : lightbox?.kind === 'damage'
              ? [lightbox.doc.area, lightbox.doc.note].filter(Boolean).join(' · ') || 'Damage'
              : ''
        }
        url={
          lightbox?.kind === 'job'
            ? lightbox.photo.url
            : lightbox?.kind === 'damage'
              ? lightbox.doc.photo_url ?? ''
              : ''
        }
        onClose={() => setLightbox(null)}
        deleting={deleting}
        onDelete={
          lightbox?.kind === 'job' ? () => void onDeleteJobPhoto(lightbox.photo) : undefined
        }
      />
    </div>
  )
}
