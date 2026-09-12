import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { PencilSimple, Plus } from '@/src/icons'
import type { DamageRecord, Vehicle } from '@rinse/core'
import { CarDamageMap, OFF_MAP_AREAS } from '@/src/components/crm/CarDamageMap'
import { DamageListRow } from '@/src/components/crm/DamageListRow'
import { FormField } from '@/src/components/FormField'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppText,
  EmptyState,
  ListRow,
  PrimaryButton,
  SecondaryButton,
  SectionGroup,
} from '@/src/components/ui'
import { BackHeaderButton } from '@/src/components/ui/BackHeaderButton'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import {
  createDamageDoc,
  getDamageDocsForVehicle,
  getVehicle,
  vehicleDisplayName,
} from '@/src/lib/damage-api'
import { photoMimeType, photoUploadFilename } from '@/src/lib/form-data-file'
import { launchCameraSafe, launchLibrarySafe, prepareLocalPhotoUri } from '@/src/lib/pick-image'
import { normalizeVehicleColorHex, vehicleIconColorOnPaint } from '@/src/lib/vehicle-color'
import { VehicleTypeIcon } from '@/src/lib/vehicle-type-icons'
import { colors, radii, shadows, spacing, webInlinePressableReset } from '@/src/theme/colors'

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
        markedAreas={records.map((r) => r.area)}
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
  markedAreas,
  onClose,
  onSaved,
}: {
  visible: boolean
  vehicleId: string
  markedAreas: string[]
  onClose: () => void
  onSaved: (doc: DamageRecord) => void
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoMime, setPhotoMime] = useState('image/jpeg')
  const [area, setArea] = useState<string | null>(null)
  const [customArea, setCustomArea] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [mapCalibrating, setMapCalibrating] = useState(false)

  const resolvedArea = area === 'Other' ? customArea.trim() : (area ?? '')
  const areaReady = Boolean(resolvedArea)

  const reset = () => {
    setPhotoUri(null)
    setPhotoMime('image/jpeg')
    setArea(null)
    setCustomArea('')
    setNote('')
    setMapCalibrating(false)
  }

  const pickPhoto = async (source: 'camera' | 'library') => {
    const result =
      source === 'camera'
        ? await launchCameraSafe({ quality: 0.85 })
        : await launchLibrarySafe({ quality: 0.85 })
    if (result && !result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPhotoUri(asset.uri)
      setPhotoMime(asset.mimeType ?? 'image/jpeg')
    }
  }

  const handleSave = async () => {
    if (!areaReady) {
      Alert.alert('Area required', 'Tap a dot on the car, or choose Interior / Other.')
      return
    }
    if (!photoUri) {
      Alert.alert('Photo required', 'Add a damage photo before saving.')
      return
    }

    setSaving(true)
    try {
      const mime = photoMimeType(photoUri, photoMime)
      const filename = photoUploadFilename(photoUri)
      const sandboxUri = await prepareLocalPhotoUri(photoUri, `damage/${vehicleId}`, filename)
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
        mime,
      )
      reset()
      onSaved(doc)
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : e instanceof Error
            ? e.message
            : 'Try again'
      Alert.alert('Save failed', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={mapCalibrating ? 'fullScreen' : 'pageSheet'}
      onRequestClose={onClose}
    >
      <ScrollView
        style={styles.modal}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapCalibrating}
        bounces={!mapCalibrating}
        nestedScrollEnabled={false}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderSide}>
            <BackHeaderButton
              onPress={() => {
                reset()
                onClose()
              }}
            />
          </View>
          <View style={styles.modalHeaderTitle} pointerEvents="none">
            <AppText variant="h2" style={styles.modalTitle} numberOfLines={1}>
              Add damage
            </AppText>
          </View>
          <View style={styles.modalHeaderSide} />
        </View>

        <CarDamageMap
          selectedArea={area}
          onSelectArea={(next) => {
            setArea(next)
            if (next !== 'Other') setCustomArea('')
          }}
          markedAreas={markedAreas}
          onCalibrateChange={setMapCalibrating}
        />

        <View style={styles.offMapRow}>
          {OFF_MAP_AREAS.map((opt) => {
            const on = area === opt
            return (
              <Pressable
                key={opt}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setArea(opt)}
                style={[styles.offMapPill, webInlinePressableReset, on ? styles.offMapPillOn : null]}
              >
                <AppText variant="bodySemiBold" style={on ? styles.offMapLabelOn : styles.offMapLabel}>
                  {opt}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {area === 'Other' ? (
          <FormField label="Custom area" value={customArea} onChangeText={setCustomArea} placeholder="e.g. Tailgate" />
        ) : null}

        {areaReady ? (
          <View style={styles.docBlock}>
            <AppText variant="caption" style={styles.docLabel}>
              Documentation
            </AppText>
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
                <Pressable
                  style={[styles.retake, webInlinePressableReset]}
                  onPress={() => setPhotoUri(null)}
                  accessibilityRole="button"
                >
                  <AppText variant="caption" style={styles.retakeLabel}>
                    Change photo
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.pickRow}>
                <SecondaryButton label="Camera" onPress={() => void pickPhoto('camera')} />
                <SecondaryButton label="Library" onPress={() => void pickPhoto('library')} />
              </View>
            )}
            <FormField label="Note" value={note} onChangeText={setNote} multiline placeholder="Optional details" />
          </View>
        ) : null}

        <View style={styles.footerActions}>
          <PrimaryButton label="Save damage doc" loading={saving} onPress={() => void handleSave()} />
          <SecondaryButton
            label="Cancel"
            onPress={() => {
              reset()
              onClose()
            }}
          />
        </View>
      </ScrollView>
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
  },
  modalContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  /** Equal side rails keep the title optically centered when Back is present. */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: spacing.xs,
  },
  modalHeaderSide: {
    width: 88,
    minWidth: 88,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  modalTitle: {
    textAlign: 'center',
  },
  offMapRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  offMapPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  offMapPillOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  offMapLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  offMapLabelOn: {
    color: colors.greenText,
    fontSize: 13,
  },
  docBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  docLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  photoPreview: {
    height: 140,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  retake: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retakeLabel: {
    color: '#fff',
    fontSize: 11,
  },
  pickRow: {
    gap: spacing.sm,
  },
  footerActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
})
