import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ChevronLeft,
  MapPin,
  Camera,
  Calendar,
  Hash,
  Palette,
  FileText,
  X,
  ImagePlus,
  AlertCircle,
  Check,
  Clock,
  ArrowLeftRight,
} from 'lucide-react'
import { CarDamageMap } from '@/components/photos/CarDamageMap'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { TYPE_META } from '@/components/cars/VehicleTypeModels'
import { paintHexFor } from '@/components/cars/FleetList'
import { CAR_MAP_PINS } from '@/lib/car-map-pins'
import type { DeskDamageDoc } from '@/lib/damage-docs-api'
import type { JobPhoto, PhotoType } from '@/lib/job-photos-api'
import type { DeskJob, DeskVehicle } from '@/lib/types'

type Props = {
  vehicle: DeskVehicle
  clientName: string
  lastService?: string
  damageDocs: DeskDamageDoc[]
  damageError: string | null
  selectedArea: string | null
  onSelectArea: (area: string | null) => void
  clientJobs: DeskJob[]
  selectedJobId: string | null
  onSelectJob: (id: string | null) => void
  photos: JobPhoto[]
  photoLoading: boolean
  photoError: string | null
  uploadType: PhotoType
  onUploadType: (t: PhotoType) => void
  uploading: boolean
  onUpload: (files: FileList | null) => void
  onDeletePhoto: (photo: JobPhoto) => void
  onBack: () => void
  onOpenContact: () => void
  onAddDamageHint: () => void
  onAddJob: () => void
  toast: (msg: string) => void
}

function vehicleLabel(v: DeskVehicle): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'
}

function formatCaptured(doc: DeskDamageDoc): string {
  const raw = doc.uploaded_at || doc.date
  if (!raw) return 'Field capture'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CarVehicleDetail({
  vehicle,
  clientName,
  lastService,
  damageDocs,
  damageError,
  selectedArea,
  onSelectArea,
  clientJobs,
  selectedJobId,
  onSelectJob,
  photos,
  photoLoading,
  photoError,
  uploadType,
  onUploadType,
  uploading,
  onUpload,
  onDeletePhoto,
  onBack,
  onOpenContact,
  onAddDamageHint,
  onAddJob,
  toast,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<JobPhoto | DeskDamageDoc | null>(null)
  const paint = paintHexFor(vehicle)
  const flagged = damageDocs.length > 0

  const markedAreas = useMemo(
    () => [...new Set(damageDocs.map((d) => d.area).filter(Boolean))],
    [damageDocs],
  )

  const areaDocs = useMemo(() => {
    if (!selectedArea) return []
    return damageDocs.filter((d) => d.area === selectedArea)
  }, [damageDocs, selectedArea])

  const documentedChips = useMemo(() => {
    const byArea = new Map<string, DeskDamageDoc[]>()
    for (const doc of damageDocs) {
      if (!doc.area) continue
      const list = byArea.get(doc.area) ?? []
      list.push(doc)
      byArea.set(doc.area, list)
    }
    return [...byArea.entries()].map(([area, docs]) => ({
      area,
      label: area,
      count: docs.length,
    }))
  }, [damageDocs])

  const pinCount = CAR_MAP_PINS.length
  const modePhotos = photos.filter((p) => p.type === uploadType)
  const beforeCount = photos.filter((p) => p.type === 'before').length
  const afterCount = photos.filter((p) => p.type === 'after').length

  return (
    <div className="flex-1 h-full overflow-y-auto thin-scrollbar bg-ink-100">
      <div className="max-w-[1080px] mx-auto px-8 py-7">
        <div className="flex items-center gap-2 text-[12px] text-ink-400 mb-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 hover:text-ink-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Cars
          </button>
          <span>/</span>
          <span className="font-medium text-ink-600">{vehicleLabel(vehicle)}</span>
        </div>

        {/* Identity */}
        <div className="bg-white rounded-2xl border border-ink-200 shadow-card p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className="w-16 h-16 rounded-xl border border-ink-200 shadow-inner relative overflow-hidden shrink-0"
              style={{ background: paint }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[22px] font-bold text-ink-900 tracking-tight">
                  {vehicleLabel(vehicle)}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-ink-100 text-ink-600">
                  {TYPE_META[vehicle.type]?.label ?? vehicle.type}
                </span>
                {flagged && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rust-50 text-rust-600">
                    <AlertCircle className="w-3 h-3" />
                    Needs review
                  </span>
                )}
              </div>
              <div className="text-[13px] text-ink-500">
                <span className="text-ink-600">{clientName}</span>
                {lastService ? ` · Last service ${lastService}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenContact}
                className="px-3 py-2 rounded-lg text-[12px] font-medium text-ink-600 border border-ink-200 hover:bg-ink-50 transition-colors"
              >
                Open in Contacts
              </button>
              <button
                type="button"
                onClick={onAddDamageHint}
                className="px-3 py-2 rounded-lg text-[12px] font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
              >
                Add damage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-ink-100">
            {[
              {
                icon: Palette,
                label: 'Paint',
                value: vehicle.color || vehicle.color_hex || '—',
                chip: paint,
              },
              { icon: Hash, label: 'Plate', value: vehicle.plate || '—' },
              { icon: FileText, label: 'VIN', value: vehicle.vin || '—' },
              {
                icon: Calendar,
                label: 'Last service',
                value: lastService || '—',
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label}>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-400 mb-1">
                    <Icon className="w-3 h-3" />
                    {s.label}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {'chip' in s && s.chip ? (
                      <span
                        className="w-3 h-3 rounded-full border border-ink-200 shrink-0"
                        style={{ background: s.chip }}
                      />
                    ) : null}
                    <span className="text-[13px] font-semibold text-ink-800 truncate">
                      {s.value}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Damage */}
        <div className="mt-6">
          <SectionTitle
            title="Damage documentation"
            sub="Top-down map mirrors the mobile app. Tap a pin to reveal field photos."
            right={
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-500" />
                  Idle area
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rust-500 border-2 border-white" />
                  Damage logged
                </span>
              </div>
            }
          />

          {damageError && (
            <p className="text-xs text-red-600 mb-3">{damageError}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">Body map</div>
                  <div className="text-[11px] text-ink-500">
                    {markedAreas.length} of {pinCount} areas documented
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-ink-100 text-[11px] font-medium text-ink-600">
                  {TYPE_META[vehicle.type]?.label ?? vehicle.type}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-ink-50 to-white rounded-xl py-2">
                <CarDamageMap
                  selectedArea={selectedArea}
                  onSelectArea={onSelectArea}
                  markedAreas={markedAreas}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-ink-100">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">
                  Documented areas
                </div>
                {documentedChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {documentedChips.map((d) => {
                      const isSel = selectedArea === d.area
                      return (
                        <button
                          key={d.area}
                          type="button"
                          onClick={() => onSelectArea(isSel ? null : d.area)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            isSel
                              ? 'bg-rust-500 text-white'
                              : 'bg-rust-50 text-rust-700 hover:bg-rust-100'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {d.label}
                          <span
                            className={`tabular-nums ${isSel ? 'text-white/70' : 'text-rust-500'}`}
                          >
                            {d.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] text-ink-400 py-1">
                    <Check className="w-4 h-4 text-brand-500" />
                    No damage logged — all areas clear.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-ink-200 shadow-card flex flex-col overflow-hidden min-h-[420px]">
              {selectedArea && areaDocs.length > 0 ? (
                <PinDetailPanel
                  area={selectedArea}
                  docs={areaDocs}
                  onClose={() => onSelectArea(null)}
                  onOpen={(doc) => setLightbox(doc)}
                  onAddPhotoHint={() =>
                    toast('Damage photos are captured on the mobile app')
                  }
                />
              ) : selectedArea ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MapPin className="w-7 h-7 text-ink-300 mb-3" />
                  <div className="text-[14px] font-semibold text-ink-800 mb-1">
                    No photos for {selectedArea}
                  </div>
                  <p className="text-[12px] text-ink-500 max-w-[260px]">
                    This pin is selected but has no field docs yet. Capture on mobile to attach
                    photos.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectArea(null)}
                    className="mt-4 text-[12px] font-medium text-brand-600"
                  >
                    Clear selection
                  </button>
                </div>
              ) : (
                <PinEmptyState damageCount={markedAreas.length} />
              )}
            </div>
          </div>
        </div>

        {/* Job photos */}
        <div className="mt-7">
          <SectionTitle
            title="Job photos"
            sub="Pick a client job to view before/after uploads. Desk can fill gaps."
          />

          <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
            {clientJobs.map((job) => {
              const isSel = selectedJobId === job.id
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onSelectJob(isSel ? null : job.id)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                    isSel
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {job.packageName || job.status}
                  <span className={isSel ? 'text-white/50' : 'text-ink-400'}>{job.date}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={onAddJob}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium text-ink-500 border border-dashed border-ink-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add job
            </button>
          </div>

          {clientJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-ink-300 p-10 text-center">
              <Camera className="w-7 h-7 text-ink-300 mx-auto mb-2" />
              <div className="text-[13px] font-medium text-ink-600">No jobs for this client yet</div>
              <div className="text-[12px] text-ink-400 mt-1">
                Create a job from Calendar, or use Add job above.
              </div>
            </div>
          ) : selectedJobId ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex rounded-lg overflow-hidden border border-ink-200">
                  {(['before', 'after'] as PhotoType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUploadType(t)}
                      className={`px-3.5 py-1.5 text-xs capitalize transition-colors ${
                        uploadType === t
                          ? 'bg-ink-900 text-white font-semibold'
                          : 'bg-white text-ink-500'
                      }`}
                    >
                      {t}
                      <span className="ml-1 tabular-nums opacity-60">
                        {t === 'before' ? beforeCount : afterCount}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50 bg-brand-600 hover:bg-brand-700"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void onUpload(e.target.files)}
                />
              </div>

              {photoLoading && <p className="text-xs text-ink-400">Loading photos…</p>}
              {photoError && <p className="text-xs text-red-600">{photoError}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <BeforeAfterColumn
                  label="Before"
                  photos={photos.filter((p) => p.type === 'before')}
                  tone="rust"
                  onOpen={(p) => setLightbox(p)}
                  onAdd={() => {
                    onUploadType('before')
                    fileRef.current?.click()
                  }}
                />
                <BeforeAfterColumn
                  label="After"
                  photos={photos.filter((p) => p.type === 'after')}
                  tone="brand"
                  onOpen={(p) => setLightbox(p)}
                  onAdd={() => {
                    onUploadType('after')
                    fileRef.current?.click()
                  }}
                />
              </div>

              {modePhotos.length === 0 && !photoLoading && !photoError ? (
                <p className="text-[11px] text-ink-400 text-center">
                  No {uploadType} photos yet — use Upload or the dashed tiles.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-ink-300 p-10 text-center">
              <Camera className="w-7 h-7 text-ink-300 mx-auto mb-2" />
              <div className="text-[13px] font-medium text-ink-600">
                Select a job chip to view photos
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-5 border-t border-ink-200 text-[11px] text-ink-400">
          Rinse Desk · Cars — damage map + job photos only. Contacts, scheduling, invoicing &amp;
          campaigns live in their own tabs.
        </div>
      </div>

      {lightbox && 'filename' in lightbox && (
        <PhotoLightbox
          open
          title={`${lightbox.type} photo`}
          url={lightbox.url}
          onClose={() => setLightbox(null)}
          onDelete={() => void onDeletePhoto(lightbox)}
        />
      )}
      {lightbox && 'photo_url' in lightbox && lightbox.photo_url && (
        <PhotoLightbox
          open
          title={lightbox.area || 'Damage'}
          url={lightbox.photo_url}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function PinDetailPanel({
  area,
  docs,
  onClose,
  onOpen,
  onAddPhotoHint,
}: {
  area: string
  docs: DeskDamageDoc[]
  onClose: () => void
  onOpen: (doc: DeskDamageDoc) => void
  onAddPhotoHint: () => void
}) {
  const primary = docs[0]!
  return (
    <div className="flex flex-col h-full animate-cars-fade-up">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rust-50 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-rust-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink-900 truncate">{area}</div>
            <div className="text-[11px] text-ink-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Captured {formatCaptured(primary)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 flex-1 overflow-y-auto thin-scrollbar">
        {primary.note ? (
          <div className="mb-4 p-3 rounded-lg bg-rust-50/60 border border-rust-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-rust-600 mb-1">
              Field note
            </div>
            <div className="text-[12px] text-ink-700 leading-relaxed">{primary.note}</div>
          </div>
        ) : null}

        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">
          {docs.filter((d) => d.photo_url).length} photo
          {docs.filter((d) => d.photo_url).length === 1 ? '' : 's'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {docs.map((doc, i) =>
            doc.photo_url ? (
              <button
                key={doc.id}
                type="button"
                onClick={() => onOpen(doc)}
                className="relative group rounded-xl overflow-hidden border border-ink-200 aspect-[4/3] bg-ink-100 text-left"
              >
                <img
                  src={doc.photo_url}
                  alt={`${area} photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white font-medium">Photo {i + 1}</span>
                </div>
              </button>
            ) : null,
          )}
          <button
            type="button"
            onClick={onAddPhotoHint}
            className="aspect-[4/3] rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-400 flex flex-col items-center justify-center text-ink-400 hover:text-brand-600 transition-colors"
          >
            <ImagePlus className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between">
        <span className="text-[11px] text-ink-400">Synced from mobile capture</span>
      </div>
    </div>
  )
}

function PinEmptyState({ damageCount }: { damageCount: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-ink-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        </div>
      </div>
      <div className="text-[14px] font-semibold text-ink-800 mb-1">
        {damageCount > 0 ? 'Tap an orange pin to view photos' : 'No damage pins yet'}
      </div>
      <div className="text-[12px] text-ink-500 max-w-[260px] leading-relaxed">
        {damageCount > 0
          ? 'Each orange dot on the map has field-captured photos and a tech note attached.'
          : 'When field techs log damage from the mobile app, orange pins appear here with photos.'}
      </div>
    </div>
  )
}

function BeforeAfterColumn({
  label,
  photos,
  tone,
  onOpen,
  onAdd,
}: {
  label: string
  photos: JobPhoto[]
  tone: 'rust' | 'brand'
  onOpen: (p: JobPhoto) => void
  onAdd: () => void
}) {
  const soft = tone === 'rust' ? 'bg-rust-50 text-rust-600' : 'bg-brand-50 text-brand-700'
  return (
    <div className="bg-white rounded-2xl border border-ink-200 shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${soft}`}
        >
          <ArrowLeftRight className="w-3 h-3" />
          {label}
        </span>
        <span className="text-[11px] text-ink-400 tabular-nums">{photos.length} photos</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p) => (
          <button
            key={p.filename}
            type="button"
            onClick={() => onOpen(p)}
            className="relative group rounded-lg overflow-hidden border border-ink-200 aspect-square bg-ink-100"
          >
            <img src={p.url} alt={`${label}`} className="w-full h-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="aspect-square rounded-lg border-2 border-dashed border-ink-200 hover:border-brand-400 flex items-center justify-center text-ink-400 hover:text-brand-600 transition-colors"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string
  sub?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
      <div>
        <h2 className="text-[15px] font-bold text-ink-900 tracking-tight">{title}</h2>
        {sub && <p className="text-[12px] text-ink-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}
