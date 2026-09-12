import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import * as api from '@/lib/api'
import { FleetList, paintHexFor, type FleetSort } from '@/components/cars/FleetList'
import { FleetEmptyState } from '@/components/cars/FleetEmptyState'
import { CarVehicleDetail } from '@/components/cars/CarVehicleDetail'
import {
  deleteJobPhoto,
  getJobPhotos,
  uploadJobPhoto,
  type JobPhoto,
  type PhotoType,
} from '@/lib/job-photos-api'
import { getDamageDocsForVehicle, type DeskDamageDoc } from '@/lib/damage-docs-api'
import type { DeskVehicle, VehicleType } from '@/lib/types'

function vehicleLabel(v: DeskVehicle): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'
}

const SORTS: FleetSort[] = ['name', 'damage', 'type']

export default function CarsPage() {
  const { vehicles, clients, jobs, setVehicles } = useData()
  const { focusVehicleId, clearFocusVehicle, openContact } = useDeskNav()
  const { promptForm, toast, alert } = useUi()
  const { createEvent } = useCreateActions()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all')
  const [sort, setSort] = useState<FleetSort>('name')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [damageDocs, setDamageDocs] = useState<DeskDamageDoc[]>([])
  const [damageError, setDamageError] = useState<string | null>(null)
  const [damageCounts, setDamageCounts] = useState<Record<string, number>>({})
  const [selectedDamageArea, setSelectedDamageArea] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [uploadType, setUploadType] = useState<PhotoType>('after')
  const [uploading, setUploading] = useState(false)

  const clientName = useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId)?.name || '',
    [clients],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = vehicles.filter((v) => {
      if (typeFilter !== 'all' && v.type !== typeFilter) return false
      if (!q) return true
      const owner = clientName(v.client_id)
      return [vehicleLabel(v), v.plate, v.vin, v.color, v.type, owner]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    list = [...list].sort((a, b) => {
      if (sort === 'damage') {
        return (damageCounts[b.id] ?? 0) - (damageCounts[a.id] ?? 0)
      }
      if (sort === 'type') {
        return a.type.localeCompare(b.type) || vehicleLabel(a).localeCompare(vehicleLabel(b))
      }
      return vehicleLabel(a).localeCompare(vehicleLabel(b))
    })
    return list
  }, [vehicles, query, typeFilter, sort, damageCounts, clientName])

  const selected = useMemo(
    () => vehicles.find((v) => v.id === selectedId) ?? null,
    [vehicles, selectedId],
  )

  const selectedClientName = selected
    ? clientName(selected.client_id) || 'Unknown client'
    : ''

  const clientJobs = useMemo(() => {
    if (!selected?.client_id) return []
    return jobs
      .filter((j) => j.client_id === selected.client_id)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [jobs, selected])

  const lastService = useMemo(() => {
    const completed = clientJobs.find((j) =>
      ['completed', 'invoiced', 'paid'].includes(j.status),
    )
    return completed?.date ?? clientJobs[0]?.date
  }, [clientJobs])

  useEffect(() => {
    if (!focusVehicleId) return
    setSelectedId(focusVehicleId)
    clearFocusVehicle()
  }, [focusVehicleId, clearFocusVehicle])

  useEffect(() => {
    setSelectedJobId(null)
    setPhotos([])
    setPhotoError(null)
    setSelectedDamageArea(null)
  }, [selectedId])

  // Prefill first client job when opening a vehicle
  useEffect(() => {
    if (!selectedId || !selected?.client_id) return
    const first = jobs
      .filter((j) => j.client_id === selected.client_id)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (first) setSelectedJobId(first.id)
  }, [selectedId, selected?.client_id, jobs])

  // Fleet-wide damage counts for list + empty overview
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const entries = await Promise.all(
        vehicles.map(async (v) => {
          try {
            const docs = await getDamageDocsForVehicle(v.id)
            return [v.id, docs.length] as const
          } catch {
            return [v.id, 0] as const
          }
        }),
      )
      if (!cancelled) {
        setDamageCounts(Object.fromEntries(entries))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vehicles])

  useEffect(() => {
    if (!selectedId) {
      setDamageDocs([])
      setDamageError(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const docs = await getDamageDocsForVehicle(selectedId)
        if (!cancelled) {
          setDamageDocs(docs)
          setDamageError(null)
          setDamageCounts((prev) => ({ ...prev, [selectedId]: docs.length }))
        }
      } catch (err) {
        if (!cancelled) {
          setDamageDocs([])
          setDamageError(err instanceof Error ? err.message : 'Could not load damage docs')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const refreshPhotos = useCallback(async (jobId: string) => {
    setPhotoLoading(true)
    setPhotoError(null)
    try {
      const list = await getJobPhotos(jobId)
      setPhotos(list)
    } catch (err) {
      setPhotos([])
      setPhotoError(err instanceof Error ? err.message : 'Could not load photos')
    } finally {
      setPhotoLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedJobId) {
      setPhotos([])
      return
    }
    void refreshPhotos(selectedJobId)
  }, [selectedJobId, refreshPhotos])

  async function createVehicle() {
    if (clients.length === 0) {
      alert('Add a contact first, then attach a vehicle.', 'No clients')
      return
    }
    const values = await promptForm({
      title: 'Add vehicle',
      submitLabel: 'Create',
      fields: [
        {
          name: 'client_id',
          label: 'Client',
          type: 'select',
          required: true,
          options: clients.map((c) => ({ value: c.id, label: c.name })),
        },
        { name: 'make', label: 'Make', required: true, placeholder: 'Toyota' },
        { name: 'model', label: 'Model', required: true, placeholder: 'Camry' },
        { name: 'year', label: 'Year', type: 'number', placeholder: '2020' },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          defaultValue: 'sedan',
          options: [
            { value: 'sedan', label: 'Sedan' },
            { value: 'suv', label: 'SUV' },
            { value: 'truck', label: 'Truck' },
            { value: 'van', label: 'Van' },
            { value: 'boat', label: 'Boat' },
            { value: 'other', label: 'Other' },
          ],
        },
        { name: 'color', label: 'Color', placeholder: 'Silver' },
        { name: 'plate', label: 'Plate' },
        { name: 'vin', label: 'VIN' },
      ],
    })
    if (!values?.client_id || !values.make || !values.model) return
    try {
      const created = await api.createVehicle({
        client_id: values.client_id,
        make: values.make,
        model: values.model,
        year: values.year ? Number(values.year) : undefined,
        type: (values.type as VehicleType) || 'sedan',
        color: values.color || undefined,
        plate: values.plate || undefined,
        vin: values.vin || undefined,
      })
      setVehicles((prev) => [created, ...prev])
      setSelectedId(created.id)
      toast('Vehicle created')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create vehicle', 'Create failed')
    }
  }

  async function onUpload(fileList: FileList | null) {
    if (!selectedJobId || !fileList?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        await uploadJobPhoto(selectedJobId, file, uploadType)
      }
      await refreshPhotos(selectedJobId)
      toast('Photos uploaded')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed', 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onDeletePhoto(photo: JobPhoto) {
    if (!selectedJobId) return
    if (!window.confirm('Delete this photo? It will also disappear on mobile.')) return
    try {
      await deleteJobPhoto(selectedJobId, photo.filename)
      await refreshPhotos(selectedJobId)
      toast('Photo deleted')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed', 'Delete failed')
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ink-100">
      <Header title="Cars" subtitle={`${vehicles.length} vehicles`} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <FleetList
          vehicles={filtered}
          allVehicles={vehicles}
          selectedId={selectedId}
          onSelect={setSelectedId}
          query={query}
          onQuery={setQuery}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          sort={sort}
          onSortCycle={() =>
            setSort((s) => SORTS[(SORTS.indexOf(s) + 1) % SORTS.length]!)
          }
          damageCounts={damageCounts}
          clientName={clientName}
          onAddVehicle={() => void createVehicle()}
          paintFor={paintHexFor}
        />

        {!selected ? (
          <FleetEmptyState
            vehicles={vehicles}
            jobs={jobs}
            damageCounts={damageCounts}
            clientName={clientName}
            onPick={setSelectedId}
          />
        ) : (
          <CarVehicleDetail
            vehicle={selected}
            clientName={selectedClientName}
            lastService={lastService}
            damageDocs={damageDocs}
            damageError={damageError}
            selectedArea={selectedDamageArea}
            onSelectArea={setSelectedDamageArea}
            clientJobs={clientJobs}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            photos={photos}
            photoLoading={photoLoading}
            photoError={photoError}
            uploadType={uploadType}
            onUploadType={setUploadType}
            uploading={uploading}
            onUpload={(files) => void onUpload(files)}
            onDeletePhoto={(p) => void onDeletePhoto(p)}
            onBack={() => setSelectedId(null)}
            onOpenContact={() => {
              if (selected.client_id) openContact(selected.client_id)
              else toast('No client linked to this vehicle')
            }}
            onAddDamageHint={() =>
              toast('Damage is logged on the mobile app — tap pins here to review')
            }
            onAddJob={() =>
              void createEvent({
                clientId: selected.client_id,
                navigate: true,
              })
            }
            toast={toast}
          />
        )}
      </div>
    </div>
  )
}
