import { loadData, newId, saveData } from '../storage'
import type { Vehicle, VehicleInput } from '../types'

export function getVehiclesForClient(clientId: string): Vehicle[] {
  return (loadData().vehicles ?? []).filter((v) => v.client_id === clientId)
}

export function getVehicle(id: string): Vehicle | null {
  return (loadData().vehicles ?? []).find((v) => v.id === id) ?? null
}

export function createVehicle(input: VehicleInput): Vehicle {
  const data = loadData()
  if (!data.vehicles) data.vehicles = []
  const vehicle: Vehicle = { id: newId(), ...input }
  data.vehicles.push(vehicle)
  saveData(data)
  return vehicle
}

export function updateVehicle(id: string, input: Partial<VehicleInput>): Vehicle | null {
  const data = loadData()
  if (!data.vehicles) data.vehicles = []
  const idx = data.vehicles.findIndex((v) => v.id === id)
  if (idx === -1) return null
  data.vehicles[idx] = { ...data.vehicles[idx], ...input }
  saveData(data)
  return data.vehicles[idx]
}
