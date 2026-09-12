import { loadData, newId, saveData } from '../storage'
import type { Equipment, EquipmentInput } from '../types'

export function getEquipment(): Equipment[] {
  return loadData().equipment ?? []
}

export function getEquipmentItem(id: string): Equipment | null {
  return getEquipment().find((e) => e.id === id) ?? null
}

export function createEquipment(input: EquipmentInput): Equipment {
  const data = loadData()
  if (!data.equipment) data.equipment = []
  const item: Equipment = { id: newId(), status: 'active', ...input }
  data.equipment.push(item)
  saveData(data)
  return item
}

export function updateEquipment(id: string, input: Partial<EquipmentInput>): Equipment | null {
  const data = loadData()
  if (!data.equipment) data.equipment = []
  const idx = data.equipment.findIndex((e) => e.id === id)
  if (idx === -1) return null
  data.equipment[idx] = { ...data.equipment[idx], ...input }
  saveData(data)
  return data.equipment[idx]
}

export function deleteEquipment(id: string): boolean {
  const data = loadData()
  if (!data.equipment) return false
  const before = data.equipment.length
  data.equipment = data.equipment.filter((e) => e.id !== id)
  if (data.equipment.length === before) return false
  saveData(data)
  return true
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function uploadEquipmentPhoto(id: string, file: File): Promise<Equipment | null> {
  const dataUrl = await readFileAsDataUrl(file)
  return updateEquipment(id, { image_url: dataUrl })
}

export async function clearEquipmentPhoto(id: string): Promise<Equipment | null> {
  return updateEquipment(id, { image_url: undefined })
}
