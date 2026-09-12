/**
 * DamageNavigator
 * Wires VehicleProfileScreen → DamageDetailScreen with local state.
 * Drop this into your existing navigator tree.
 *
 * If you use Expo Router: replace this with file-based routes.
 * If you use React Navigation: slot this into your Stack.
 *
 * --- MOCK DATA is included so you can run this standalone ---
 */

import React, { useState } from 'react';
import VehicleProfileScreen from './VehicleProfileScreen';
import DamageDetailScreen from './DamageDetailScreen';
import { DamageRecord, Vehicle } from './types';

// ─── Mock data (replace with real API calls) ─────────────────────────────────
const MOCK_VEHICLE: Vehicle = {
  id: 'v1',
  name: '2022 Tesla Model 3',
  plate: 'DX91AB',
  type: 'Sedan',
  color: 'Midnight Blue',
  colorHex: '#1a3a6a',
  vin: '5YJ3E···1234',
  photoUri: null,
};

const MOCK_DAMAGES_POPULATED: DamageRecord[] = [
  {
    id: 'd1',
    vehicleId: 'v1',
    area: 'Front bumper',
    note: 'Small paint chip, pre-existing — noted by client at intake',
    date: 'Jun 2, 2026',
    capturedAt: 'Jun 2, 2026 · 9:14 AM',
    photoUri: null,
  },
  {
    id: 'd2',
    vehicleId: 'v1',
    area: 'Driver door — scratch',
    note: 'Light surface scratch, approx 4 inches, clear coat only',
    date: 'May 15, 2026',
    capturedAt: 'May 15, 2026 · 2:30 PM',
    photoUri: null,
  },
  {
    id: 'd3',
    vehicleId: 'v1',
    area: 'Rear quarter panel',
    note: 'Hail pitting, minor. Pre-existing per client.',
    date: 'Feb 14, 2026',
    capturedAt: 'Feb 14, 2026 · 11:05 AM',
    photoUri: null,
  },
];

// ─── Navigator ────────────────────────────────────────────────────────────────
type Screen = 'profile' | 'detail';

export default function DamageNavigator({
  startPopulated = false, // set true to test 2b-ii
}: {
  startPopulated?: boolean;
}) {
  const [screen, setScreen]         = useState<Screen>('profile');
  const [damages, setDamages]       = useState<DamageRecord[]>(
    startPopulated ? MOCK_DAMAGES_POPULATED : [],
  );
  const [selected, setSelected]     = useState<DamageRecord | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleDamagePress(d: DamageRecord) {
    setSelected(d);
    setScreen('detail');
  }

  function handleDamageSaved(record: DamageRecord) {
    setDamages((prev) => [record, ...prev]);
  }

  function handleDeleted(id: string) {
    setDamages((prev) => prev.filter((d) => d.id !== id));
    setScreen('profile');
  }

  function handleNoteEdited(updated: DamageRecord) {
    setDamages((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelected(updated);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (screen === 'detail' && selected) {
    return (
      <DamageDetailScreen
        damage={selected}
        onBack={() => setScreen('profile')}
        onDeleted={handleDeleted}
        onNoteEdited={handleNoteEdited}
      />
    );
  }

  return (
    <VehicleProfileScreen
      vehicle={MOCK_VEHICLE}
      damages={damages}
      onBack={() => {/* pop to your vehicles list */}}
      onEdit={() => {/* push vehicle edit screen */}}
      onDamagePress={handleDamagePress}
      onDamageSaved={handleDamageSaved}
    />
  );
}
