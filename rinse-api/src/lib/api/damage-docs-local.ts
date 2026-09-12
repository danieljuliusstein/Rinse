import { loadData, newId, saveData } from '../storage'
import type { DamageRecord, DamageRecordInput } from '../types'

export function getDamageDocsForVehicle(vehicleId: string): DamageRecord[] {
  return (loadData().damage_docs ?? [])
    .filter((d) => d.vehicle_id === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getDamageDoc(id: string): DamageRecord | null {
  return (loadData().damage_docs ?? []).find((d) => d.id === id) ?? null
}

export function createDamageDoc(input: DamageRecordInput): DamageRecord {
  const data = loadData()
  if (!data.damage_docs) data.damage_docs = []
  const record: DamageRecord = {
    id: newId(),
    vehicle_id: input.vehicle_id,
    area: input.area,
    note: input.note,
    date: input.date,
    captured_at: input.captured_at,
    photo_url: input.photo_url ?? null,
    linked_job_id: input.linked_job_id,
  }
  data.damage_docs.push(record)
  saveData(data)
  return record
}

export function updateDamageDocNote(id: string, note: string): DamageRecord | null {
  const data = loadData()
  if (!data.damage_docs) data.damage_docs = []
  const idx = data.damage_docs.findIndex((d) => d.id === id)
  if (idx === -1) return null
  data.damage_docs[idx] = { ...data.damage_docs[idx], note }
  saveData(data)
  return data.damage_docs[idx]
}

export function deleteDamageDoc(id: string): boolean {
  const data = loadData()
  if (!data.damage_docs) return false
  const before = data.damage_docs.length
  data.damage_docs = data.damage_docs.filter((d) => d.id !== id)
  if (data.damage_docs.length === before) return false
  saveData(data)
  return true
}
