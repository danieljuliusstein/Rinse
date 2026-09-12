export type DamageRecord = {
  id: string;
  vehicleId: string;
  area: string;
  note: string;
  date: string;        // 'Jun 2, 2026'
  capturedAt: string;  // 'Jun 2, 2026 · 9:14 AM'
  photoUri: string | null;
  linkedJobId?: string;
};

export type Vehicle = {
  id: string;
  name: string;       // '2022 Tesla Model 3'
  plate: string;
  type: string;
  color: string;
  colorHex: string;
  vin: string;
  photoUri?: string | null;
};

export const AREA_OPTIONS = [
  'Front bumper',
  'Hood',
  'Driver door',
  'Passenger door',
  'Roof',
  'Rear bumper',
  'Trunk',
  'Wheels',
  'Interior',
  'Other',
] as const;
