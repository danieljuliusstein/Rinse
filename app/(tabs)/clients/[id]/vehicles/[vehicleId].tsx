import { useCallback, useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { PencilSimple, Plus } from 'phosphor-react-native'
import type { DamageRecord, Vehicle } from '@rinse/core'
import { DamageListRow } from '@/src/components/crm/DamageListRow'
import { FormField } from '@/src/components/FormField'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  EmptyState,
  ListRow,
  PillGroup,
  PrimaryButton,
  SecondaryButton,
  SectionGroup,
} from '@/src/components/ui'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import {
  createDamageDoc,
  getDamageDocsForVehicle,
  getVehicle,
  vehicleDisplayName,
} from '@/src/lib/damage-api'
import { persistPhotoToSandbox } from '@/src/lib/photo-sandbox'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/src/lib/vehicle-color'
import { VehicleTypeIcon } from '@/src/lib/vehicle-type-icons'
import { colors, radii, shadows, spacing, webInlinePressableReset } from '@/src/theme/colors'

const DAMAGE_AREAS = [
  'Front bumper',
  'Hood',
  'Driver door',
  'Passenger door',
  'Roof',
  'Rear bumper',
  'Trunk',
  'Tailgate',
  'Wheels',
  'Interior',
  'Other',
] as const

function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function VehicleProfileScreen() {
  const { id: clientId, vehicleId } = useLocalSearchParams<{ id: string; vehicleId: string }>()
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [records, setRecords] = useState<DamageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clientId || !vehicleId) return
    setError(null)
    const match = await getVehicle(clientId, vehicleId)
    setVehicle(match)
    setRecords(await getDamageDocsForVehicle(vehicleId))
  }, [clientId, vehicleId])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load vehicle')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  if (loading) return <LoadingState label="Loading vehicle…" />

  if (error || !vehicle) {
    return (
      <OperatorScreen title="Vehicle" headerRight={<DetailHeaderActions onBack={() => router.back()} />}>
        <AppText variant="body" style={styles.error}>
          {error ?? 'Vehicle not found'}
        </AppText>
      </OperatorScreen>
    )
  }

  const paintHex = normalizeVehicleColorHex(vehicle.color_hex)
  const iconColor = vehicleIconColorOnPaint(vehicle.color_hex)

  return (
    <OperatorScreen
      title={vehicleDisplayName(vehicle)}
      subtitle={vehicle.plate || undefined}
      headerRight={
        <View style={styles.headerActions}>
          <IconHeaderButton
            label="Edit vehicle"
            onPress={() => router.push(`/clients/${clientId}/vehicles/edit/${vehicleId}` as never)}
          >
            <PencilSimple size={18} color={colors.textSecondary} weight="bold" />
          </IconHeaderButton>
          <DetailHeaderActions onBack={() => router.back()} />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              paintHex ? styles.heroIconPaint : null,
              paintHex ? { backgroundColor: paintHex } : null,
            ]}
          >
            <VehicleTypeIcon type={vehicle.type} size={paintHex ? 28 : 28} color={iconColor} />
          </View>
        </View>

        <SectionGroup title="Vehicle details">
          <ListRow grouped title="Plate" trailing={<AppText variant="body">{vehicle.plate || '—'}</AppText>} showChevron={false} />
          <ListRow grouped title="Type" trailing={<AppText variant="body">{capitalizeType(vehicle.type)}</AppText>} showChevron={false} />
          <ListRow
            grouped
            title="Color"
            trailing={
              <View style={styles.colorValue}>
                {paintHex ? <View style={[styles.swatch, { backgroundColor: paintHex }]} /> : null}
                <AppText variant="body">{vehicle.color || '—'}</AppText>
              </View>
            }
            showChevron={false}
          />
          <ListRow grouped isLast title="VIN" trailing={<AppText variant="body">{vehicle.vin || '—'}</AppText>} showChevron={false} />
        </SectionGroup>

        {records.length === 0 ? (
          <EmptyState
            title="No damage documented"
            description="Add photos of scratches, dents, or existing wear before each job."
            actionLabel="Add damage documentation"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <SectionGroup title="Pre-existing damage" meta={String(records.length)}>
            {records.map((record) => (
              <DamageListRow
                key={record.id}
                damage={record}
                isLast={false}
                onPress={() => {
                  void load()
                }}
              />
            ))}
            <Pressable
              style={[styles.morePill, webInlinePressableReset]}
              onPress={() => setShowAdd(true)}
              accessibilityRole="button"
            >
              <Plus size={14} color={colors.textSecondary} weight="bold" />
              <AppText variant="bodySemiBold" style={styles.morePillLabel}>
                Add damage documentation
              </AppText>
            </Pressable>
          </SectionGroup>
        )}
      </ScrollView>

      <AddDamageModal
        visible={showAdd}
        vehicleId={vehicle.id}
        onClose={() => setShowAdd(false)}
        onSaved={(doc) => {
          setRecords((prev) => [doc, ...prev])
          setShowAdd(false)
        }}
      />
    </OperatorScreen>
  )
}

function AddDamageModal({
  visible,
  vehicleId,
  onClose,
  onSaved,
}: {
  visible: boolean
  vehicleId: string
  onClose: () => void
  onSaved: (doc: DamageRecord) => void
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [area, setArea] = useState<string>(DAMAGE_AREAS[0])
  const [customArea, setCustomArea] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const resolvedArea = area === 'Other' ? customArea.trim() : area

  const reset = () => {
    setPhotoUri(null)
    setArea(DAMAGE_AREAS[0])
    setCustomArea('')
    setNote('')
  }

  const pickPhoto = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Enable camera or photo access in Settings.')
      return
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 })
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  const handleSave = async () => {
    if (!photoUri) {
      Alert.alert('Photo required', 'Add a damage photo before saving.')
      return
    }
    if (!resolvedArea) {
      Alert.alert('Area required', 'Select or enter a damage area.')
      return
    }

    setSaving(true)
    try {
      const ext = photoUri.split('.').pop() ?? 'jpg'
      const filename = `damage-${Date.now()}.${ext}`
      const sandboxUri = await persistPhotoToSandbox(photoUri, `damage/${vehicleId}`, filename)
      const today = new Date().toISOString().split('T')[0]
      const doc = await createDamageDoc(
        {
          vehicle_id: vehicleId,
          area: resolvedArea,
          note: note.trim(),
          date: today,
          captured_at: new Date().toISOString(),
        },
        sandboxUri,
        filename,
        'image/jpeg',
      )
      reset()
      onSaved(doc)
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <AppText variant="h2" style={styles.modalTitle}>
          Add damage
        </AppText>
        {!photoUri ? (
          <View style={styles.pickRow}>
            <SecondaryButton label="Camera" onPress={() => void pickPhoto('camera')} />
            <SecondaryButton label="Library" onPress={() => void pickPhoto('library')} />
          </View>
        ) : null}
        <PillGroup
          label="Area"
          options={DAMAGE_AREAS.map((a) => ({ value: a, label: a }))}
          value={area}
          onChange={setArea}
        />
        {area === 'Other' ? (
          <FormField label="Custom area" value={customArea} onChangeText={setCustomArea} />
        ) : null}
        <FormField label="Note" value={note} onChangeText={setNote} multiline placeholder="Optional details" />
        <PrimaryButton label="Save damage doc" loading={saving} onPress={() => void handleSave()} />
        <SecondaryButton
          label="Cancel"
          onPress={() => {
            reset()
            onClose()
          }}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hero: {
    height: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconPaint: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  colorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  morePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  morePillLabel: {
    color: colors.textSecondary,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    marginBottom: spacing.sm,
  },
  pickRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
})
