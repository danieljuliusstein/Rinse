export type CarMapPin = {
  id: string
  /** Percent of map width (0–100), center of pin */
  left: number
  /** Percent of map height (0–100), center of pin */
  top: number
}

/**
 * Default pin layout for assets/car-top-view.png (front at top).
 * Matches apps/mobile `car-map-pins.ts`.
 */
export const CAR_MAP_PINS: CarMapPin[] = [
  // Front
  { id: 'Front bumper — left', left: 33, top: 6.5 },
  { id: 'Front bumper — center', left: 50, top: 5 },
  { id: 'Front bumper — right', left: 67, top: 6.5 },
  { id: 'Hood', left: 50, top: 16 },
  { id: 'Front left fender', left: 23, top: 17.3 },
  { id: 'Front right fender', left: 73.3, top: 17.3 },
  { id: 'Left headlight', left: 26.5, top: 10 },
  { id: 'Right headlight', left: 73.1, top: 10 },

  // Glass / cabin
  { id: 'Windshield', left: 50, top: 30 },
  { id: 'Roof', left: 49.5, top: 52.3 },
  { id: 'Rear window', left: 49.5, top: 73.8 },

  // Doors & mirrors (driver = left)
  { id: 'Left mirror', left: 21, top: 32.9 },
  { id: 'Right mirror', left: 78.5, top: 32.9 },
  { id: 'Driver door', left: 21.2, top: 39.8 },
  { id: 'Passenger door', left: 77.2, top: 39.8 },
  { id: 'Driver rear door', left: 21.2, top: 51.4 },
  { id: 'Passenger rear door', left: 77.7, top: 51.4 },

  // Rear body
  { id: 'Left rear quarter', left: 23.1, top: 78.1 },
  { id: 'Right rear quarter', left: 75.4, top: 77.3 },
  { id: 'Trunk', left: 49.5, top: 83.5 },
  { id: 'Left taillight', left: 29, top: 87 },
  { id: 'Right taillight', left: 70, top: 87 },
  { id: 'Rear bumper — left', left: 29.8, top: 92.8 },
  { id: 'Rear bumper — center', left: 49.2, top: 94 },
  { id: 'Rear bumper — right', left: 69.4, top: 92.8 },

  // Tires
  { id: 'Left front tire', left: 19.2, top: 21.3 },
  { id: 'Right front tire', left: 80, top: 21.4 },
  { id: 'Left rear tire', left: 18.3, top: 73.5 },
  { id: 'Right rear tire', left: 80.5, top: 73.5 },
]

export const CAR_MAP_AREAS = CAR_MAP_PINS.map((p) => p.id)

/** Areas that aren't on the top-down exterior map. */
export const OFF_MAP_AREAS = ['Interior', 'Undercarriage', 'Other'] as const
