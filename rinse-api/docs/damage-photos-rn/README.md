# Atlas — Damage Photos (Screen 2b) — React Native Reference

Reference implementation for a future Expo / React Native app. The **live PWA** already implements the same flows in Next.js — see [Web mapping](#web-pwa-mapping) below.

## Files

| File | Screen |
|------|--------|
| `theme.ts` | Design tokens (colors, fonts) |
| `types.ts` | TypeScript types + area options |
| `VehicleProfileScreen.tsx` | 2b-i empty + 2b-ii populated |
| `AddDamageSheet.tsx` | 2b-iii photo picker + 2b-iv add form |
| `DamageDetailScreen.tsx` | 2b-v damage detail |
| `DamageNavigator.tsx` | Wires all screens together (standalone demo) |

---

## Install dependencies

```bash
# Modal (bottom sheet)
npx expo install react-native-modal

# Image picker (camera + library)
npx expo install expo-image-picker

# Icons (pick one)
npx expo install @expo/vector-icons          # already in Expo SDK
# OR
npm install @tabler/icons-react-native       # matches mockup exactly

# Fonts
npx expo install @expo-google-fonts/syne @expo-google-fonts/dm-sans expo-font
```

---

## Font setup (app entry point)

```tsx
import {
  useFonts,
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';

export default function App() {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) return null;
  return <DamageNavigator startPopulated />;
}
```

---

## Drop into existing React Navigation stack

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VehicleProfileScreen from './damage/VehicleProfileScreen';
import DamageDetailScreen from './damage/DamageDetailScreen';

const Stack = createNativeStackNavigator();

<Stack.Screen
  name="VehicleProfile"
  component={VehicleProfileScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="DamageDetail"
  component={DamageDetailScreen}
  options={{ headerShown: false }}
/>
```

---

## Wire up your API

Search for `// TODO:` in the components — there are 3:

1. **`AddDamageSheet.tsx`** — upload photo to storage, get back URI
2. **`AddDamageSheet.tsx`** — POST new damage record
3. **`DamageDetailScreen.tsx`** — DELETE `/damages/:id`

Point these at the same PocketBase collections the PWA uses: `vehicles`, `damage_docs`.

---

## Test empty vs populated

```tsx
// Empty state (2b-i)
<DamageNavigator startPopulated={false} />

// Populated (2b-ii)
<DamageNavigator startPopulated={true} />
```

---

## Web PWA mapping

| RN reference | Next.js (implemented) |
|--------------|-------------------------|
| `theme.ts` | `src/app/globals.css` + `src/app/damage/damage.css` |
| `types.ts` → `AREA_OPTIONS` | `src/lib/damage-docs.ts` → `DAMAGE_AREA_OPTIONS` |
| `types.ts` → `DamageRecord` | `src/lib/types.ts` → `DamageRecord` (`vehicle_id`, `photo_url`, snake_case) |
| `types.ts` → `Vehicle.name` | `vehicleDisplayName()` in `src/lib/damage-docs.ts` |
| `VehicleProfileScreen` | `src/components/crm/VehicleProfile.tsx` + `damage/DamageSection.tsx` |
| `AddDamageSheet` (2b-iii) | `src/components/crm/damage/AddDamageSheet.tsx` |
| `AddDamageSheet` form (2b-iv) | `src/components/crm/damage/AddDamageForm.tsx` on route `.../damage/new` |
| `DamageDetailScreen` | `src/components/crm/damage/DamageDetailView.tsx` |
| `DamageNavigator` | Next.js file routes under `src/app/clients/[id]/vehicles/` |

### Navigation (PWA)

```
Clients → [client] → Vehicles → [vehicle] → PRE-EXISTING DAMAGE
```

Routes:

- `/clients/[id]/vehicles/[vehicleId]` — profile + damage section
- `/clients/[id]/vehicles/[vehicleId]/damage/new` — add form (after photo pick)
- `/clients/[id]/vehicles/[vehicleId]/damage/[damageId]` — detail
- `/clients/[id]/vehicles/new` — add vehicle
- `/clients/[id]/vehicles/[vehicleId]/edit` — edit vehicle (pencil icon)

### Key differences

| Behavior | RN reference | Web PWA |
|----------|--------------|---------|
| Add form | Stays inside modal (`step: 'form'`) | Separate page after `sessionStorage` photo stash |
| Field names | camelCase (`vehicleId`, `photoUri`) | snake_case (`vehicle_id`, `photo_url`) — PocketBase |
| Icons | Ionicons / Tabler | Phosphor |
| API | TODO stubs | `createDamageDoc`, `getDamageDocsForVehicle`, PocketBase + local |
