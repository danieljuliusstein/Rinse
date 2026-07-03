'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CameraPlus, Image as ImageIcon, ShareNetwork } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import AddJobPhotoSheet from '@/components/jobs/AddJobPhotoSheet'
import { EmptyState } from '@/components/ui'
import JobPhotoLightbox from '@/components/jobs/JobPhotoLightbox'
import ShareLinkActions from '@/components/portal/ShareLinkActions'
import { deleteJobPhoto, getJobPhotos, uploadJobPhoto } from '@/lib/api'
import {
  isJobPhotoTypeAtLimit,
  jobPhotoLimitMessage,
  MAX_JOB_PHOTOS_PER_TYPE,
} from '@/lib/job-photo-limits'
import type { JobPhoto, JobWithRelations, PhotoType } from '@/lib/types'

function formatJobDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PhotoSection({
  type,
  photos,
  uploading,
  onAdd,
  onOpen,
  successThumb,
}: {
  type: PhotoType
  photos: JobPhoto[]
  uploading: boolean
  onAdd: () => void
  onOpen: (index: number) => void
  successThumb?: string | null
}) {
  const label = type === 'before' ? 'Before' : 'After'
  const labelClass =
    type === 'before' ? 'job-photos__section-label--before' : 'job-photos__section-label--after'
  const atLimit = isJobPhotoTypeAtLimit(photos.length)

  return (
    <section className={`job-photos__section${uploading ? ' job-photos__section--uploading' : ''}`}>
      <div className="job-photos__section-head">
        <div>
          <h2 className={`job-photos__section-label ${labelClass}`}>{label}</h2>
          <p className="job-photos__section-cap">
            {photos.length}/{MAX_JOB_PHOTOS_PER_TYPE} · saved compressed
          </p>
        </div>
        <button
          type="button"
          className="job-photos__add-chip"
          onClick={onAdd}
          disabled={uploading || atLimit}
          title={atLimit ? jobPhotoLimitMessage(type) : undefined}
        >
          <CameraPlus size={14} weight="bold" aria-hidden="true" />
          {atLimit ? 'Full' : 'Add'}
        </button>
      </div>
      <div className="job-photos__grid">
        {photos.length === 0 ? (
          <div className="job-photos__empty-state">
            <EmptyState
              illustration="photos"
              title={`No ${label.toLowerCase()} photos`}
              description="Tap Add to capture from your camera or library."
            />
          </div>
        ) : (
          photos.map((p, i) => (
            <button
              key={p.filename}
              type="button"
              className={[
                'job-photos__thumb',
                p.filename === successThumb ? ' job-photos__thumb--success' : '',
              ].join('')}
              onClick={() => onOpen(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" />
            </button>
          ))
        )}
      </div>
    </section>
  )
}

export default function PhotoGallery({ job }: { job: JobWithRelations }) {
  const router = useRouter()
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [successThumb, setSuccessThumb] = useState<string | null>(null)
  const [addType, setAddType] = useState<PhotoType | null>(null)
  const [lightbox, setLightbox] = useState<{ type: PhotoType; index: number } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [error, setError] = useState('')

  const loadPhotos = useCallback(async () => {
    const list = await getJobPhotos(job.id)
    setPhotos(list)
  }, [job.id])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  const beforePhotos = photos.filter((p) => p.type === 'before')
  const afterPhotos = photos.filter((p) => p.type === 'after')

  const tryOpenAdd = (type: PhotoType) => {
    const count = type === 'before' ? beforePhotos.length : afterPhotos.length
    if (isJobPhotoTypeAtLimit(count)) {
      setError(jobPhotoLimitMessage(type))
      return
    }
    setError('')
    setAddType(type)
  }

  const handleUpload = async (file: File, type: PhotoType) => {
    setUploading(true)
    setAddType(null)
    setError('')
    try {
      const photo = await uploadJobPhoto(job.id, file, type)
      await loadPhotos()
      setSuccessThumb(photo.filename)
      window.setTimeout(() => setSuccessThumb(null), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    await deleteJobPhoto(job.id, filename)
    await loadPhotos()
  }

  const clientName = job.client?.name ?? 'Client'
  const packageName = job.package?.name ?? 'Detail'

  return (
    <div className="screen page-content body job-photos">
        <header className="page-header page-header--compact job-photos__header">
          <BackButton onClick={() => router.back()} />
          <div className="page-header__title-block">
            <h1>Photos</h1>
            <p>
              {clientName} · {packageName}
            </p>
            <p>{formatJobDate(job.date)}</p>
          </div>
          <span className="job-photos__count">{photos.length}</span>
        </header>

        {error ? <div className="job-photos__error">{error}</div> : null}

        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div className="job-photos__compare">
            <div className="job-photos__compare-thumb">
              {beforePhotos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={beforePhotos[0].url} alt="" />
              ) : (
                <ImageIcon size={20} weight="duotone" aria-hidden="true" />
              )}
            </div>
            <ArrowRight size={16} className="job-photos__compare-arrow" aria-hidden="true" />
            <div className="job-photos__compare-thumb job-photos__compare-thumb--after">
              {afterPhotos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={afterPhotos[0].url} alt="" />
              ) : (
                <ImageIcon size={20} weight="duotone" aria-hidden="true" />
              )}
            </div>
            <span className="job-photos__compare-label">
              {beforePhotos.length} before · {afterPhotos.length} after
            </span>
          </div>
        )}

        <PhotoSection
          type="before"
          photos={beforePhotos}
          uploading={uploading}
          successThumb={successThumb}
          onAdd={() => tryOpenAdd('before')}
          onOpen={(index) => setLightbox({ type: 'before', index })}
        />

        <PhotoSection
          type="after"
          photos={afterPhotos}
          uploading={uploading}
          successThumb={successThumb}
          onAdd={() => tryOpenAdd('after')}
          onOpen={(index) => setLightbox({ type: 'after', index })}
        />

      {photos.length > 0 && job.client && (
        <div className="job-photos__footer">
          <div className="job-photos__footer-inner">
            <button
              type="button"
              className="job-photos__share-btn"
              onClick={() => setShareOpen((o) => !o)}
            >
              <ShareNetwork size={18} weight="bold" aria-hidden="true" />
              Share with client
            </button>
            {shareOpen && (
              <div className="job-photos__share-expanded">
                <ShareLinkActions
                  clientId={job.client_id}
                  clientEmail={job.client.email}
                  clientName={job.client.name}
                  jobId={job.id}
                  context="photos"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {addType && (
        <AddJobPhotoSheet
          sectionLabel={addType === 'before' ? 'Before' : 'After'}
          onPhotoSelected={(file) => void handleUpload(file, addType)}
          onClose={() => setAddType(null)}
        />
      )}

      {lightbox && (
        <JobPhotoLightbox
          photos={lightbox.type === 'before' ? beforePhotos : afterPhotos}
          index={lightbox.index}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox({ ...lightbox, index })}
          onDelete={(filename) => void handleDelete(filename)}
        />
      )}
    </div>
  )
}
