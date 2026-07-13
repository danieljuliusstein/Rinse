import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  formatLiabilityTimestamp,
  jobHasPreJobInspection,
  liabilityTimestamp,
  type DamageRecord,
  type Vehicle,
} from '@rinse/core'
import { CarDamageMap } from '@/src/components/crm/CarDamageMap'
import { DamageListRow } from '@/src/components/crm/DamageListRow'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { FormField } from '@/src/components/FormField'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getJob, updateJob } from '@/src/lib/api'
import {
  createDamageDoc,
  getDamageDocsForJob,
  listVehiclesForClient,
  vehicleDisplayName,
} from '@/src/lib/damage-api'
import { photoMimeType, photoUploadFilename } from '@/src/lib/form-data-file'
import { launchCameraSafe, launchLibrarySafe, prepareLocalPhotoUri } from '@/src/lib/pick-image'
import { shareInspectionPdf } from '@/src/lib/share'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'

export default function JobInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const dockPadding = useTabDockPadding()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [clientId, setClientId] = useState('')
  const [jobStatus, setJobStatus] = useState<string>('scheduled')
  const [inspectionAt, setInspectionAt] = useState<string | undefined>()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [docs, setDocs] = useState<DamageRecord[]>([])
  const [noDamage, setNoDamage] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoMime, setPhotoMime] = useState('image/jpeg')
  const [area, setArea] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    const job = await getJob(id)
    if (!job) throw new Error('Job not found')
    setClientId(job.client_id)
    setJobStatus(job.status)
    setInspectionAt(job.inspection_completed_at)
    if (job.inspection_vehicle_id) setVehicleId(job.inspection_vehicle_id)

    const [vehicleRows, damageRows] = await Promise.all([
      listVehiclesForClient(job.client_id),
      getDamageDocsForJob(id),
    ])
    setVehicles(vehicleRows)
    setDocs(damageRows)
    if (!job.inspection_vehicle_id && vehicleRows[0]) {
      setVehicleId(vehicleRows[0].id)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const completed = jobHasPreJobInspection({ inspection_completed_at: inspectionAt })
  const canFinish = Boolean(vehicleId) && (noDamage || docs.length > 0)

  const markedAreas = useMemo(() => docs.map((d) => d.area), [docs])

  const pickPhoto = async (source: 'camera' | 'library') => {
    const result =
      source === 'camera'
        ? await launchCameraSafe({ quality: 0.85 })
        : await launchLibrarySafe({ quality: 0.85 })
    if (result && !result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      setPhotoMime(result.assets[0].mimeType ?? 'image/jpeg')
    }
  }

  const addDamage = async () => {
    if (!id || !vehicleId || !area || !photoUri) {
      Alert.alert('Photo + area required', 'Capture a photo and tap the damaged panel.')
      return
    }
    setBusy(true)
    try {
      const mime = photoMimeType(photoUri, photoMime)
      const filename = photoUploadFilename(photoUri)
      const sandboxUri = await prepareLocalPhotoUri(photoUri, `damage/${vehicleId}`, filename)
      const today = new Date().toISOString().split('T')[0]
      const doc = await createDamageDoc(
        {
          vehicle_id: vehicleId,
          area,
          note: note.trim(),
          date: today,
          captured_at: new Date().toISOString(),
          linked_job_id: id,
        },
        sandboxUri,
        filename,
        mime,
      )
      setDocs((rows) => [doc, ...rows])
      setPhotoUri(null)
      setArea(null)
      setNote('')
      setNoDamage(false)
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setBusy(false)
    }
  }

  const finishWalkthrough = async (startJob: boolean) => {
    if (!id || !vehicleId) return
    if (!completed && !canFinish) {
      Alert.alert(
        'Walkthrough incomplete',
        'Document at least one damage photo, or confirm no visible damage.',
      )
      return
    }
    setBusy(true)
    try {
      const job = await getJob(id)
      if (!job) throw new Error('Job not found')
      const nextStatus = startJob
        ? 'in_progress'
        : job.status === 'scheduled'
          ? 'scheduled'
          : job.status
      const updated = await updateJob(id, {
        date: job.date,
        packageId: job.package_id,
        vehicleType: job.vehicle_type,
        locationType: job.location_type,
        revenue: job.revenue,
        tip: job.tip,
        hours_worked: job.hours_worked,
        start_time: job.start_time,
        notes: job.notes,
        status: nextStatus,
        ...(completed
          ? {}
          : {
              inspection_completed_at: 'pending',
              inspection_vehicle_id: vehicleId,
            }),
      })
      setInspectionAt(updated.inspection_completed_at)
      setJobStatus(updated.status)
      Alert.alert(
        completed ? 'Job updated' : 'Walkthrough saved',
        startJob
          ? 'Job is now in progress.'
          : 'Liability inspection stamped. You can start the job when ready.',
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch (e) {
      Alert.alert('Could not finish', e instanceof Error ? e.message : 'Try again')
    } finally {
      setBusy(false)
    }
  }

  const exportPdf = async () => {
    if (!id) return
    setBusy(true)
    try {
      await shareInspectionPdf(id)
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <OperatorScreen title="Pre-job walkthrough">
        <AppText variant="caption" style={styles.muted}>
          Loading…
        </AppText>
      </OperatorScreen>
    )
  }

  return (
    <OperatorScreen
      title="Pre-job walkthrough"
      subtitle="Document existing damage before work starts"
      headerRight={<DetailHeaderActions onBack={() => router.back()} />}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}>
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        {completed ? (
          <View style={styles.banner}>
            <AppText variant="bodySemiBold">Walkthrough complete</AppText>
            <AppText variant="caption" style={styles.muted}>
              Server stamped {formatLiabilityTimestamp(inspectionAt)}
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" style={styles.lead}>
            Required before moving this job to In progress. Photos upload offline and stamp
            server upload time when synced.
          </AppText>
        )}

        <AppText variant="sectionLabel">Vehicle</AppText>
        {vehicles.length === 0 ? (
          <AppText variant="caption" style={styles.muted}>
            Add a vehicle on the client profile first.
          </AppText>
        ) : (
          vehicles.map((v) => {
            const selected = vehicleId === v.id
            return (
              <Pressable
                key={v.id}
                disabled={completed}
                onPress={() => setVehicleId(v.id)}
                style={({ pressed }) => [
                  styles.vehicleRow,
                  webInlinePressableReset,
                  selected && styles.vehicleOn,
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="bodySemiBold">{vehicleDisplayName(v)}</AppText>
                {v.plate ? (
                  <AppText variant="caption" style={styles.muted}>
                    {v.plate}
                  </AppText>
                ) : null}
              </Pressable>
            )
          })
        )}

        {!completed && vehicleId ? (
          <>
            <AppText variant="sectionLabel">Document damage</AppText>
            <CarDamageMap selectedArea={area} onSelectArea={setArea} markedAreas={markedAreas} />
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            ) : null}
            <View style={styles.row}>
              <SecondaryButton label="Camera" onPress={() => void pickPhoto('camera')} />
              <SecondaryButton label="Library" onPress={() => void pickPhoto('library')} />
            </View>
            <FormField label="Note (optional)" value={note} onChangeText={setNote} />
            <PrimaryButton
              label={busy ? 'Saving…' : 'Add damage photo'}
              loading={busy}
              onPress={() => void addDamage()}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <AppText variant="bodySemiBold">No visible damage</AppText>
                <AppText variant="caption" style={styles.muted}>
                  Confirm the walkthrough found nothing to document.
                </AppText>
              </View>
              <Switch value={noDamage} onValueChange={setNoDamage} />
            </View>
          </>
        ) : null}

        <AppText variant="sectionLabel">This job&apos;s docs</AppText>
        {docs.length === 0 ? (
          <AppText variant="caption" style={styles.muted}>
            No damage photos linked yet.
          </AppText>
        ) : (
          docs.map((doc, i) => (
            <DamageListRow
              key={doc.id}
              damage={doc}
              isLast={i === docs.length - 1}
              onPress={() => {
                const stamp = liabilityTimestamp(doc)
                Alert.alert(
                  doc.area,
                  [
                    doc.note || 'No note',
                    stamp ? `Uploaded ${formatLiabilityTimestamp(stamp)}` : 'Upload pending sync',
                  ].join('\n'),
                )
              }}
            />
          ))
        )}

        {!completed ? (
          <View style={styles.footerActions}>
            <PrimaryButton
              label={busy ? 'Saving…' : 'Finish & start job'}
              loading={busy}
              disabled={!canFinish}
              onPress={() => void finishWalkthrough(true)}
            />
            <SecondaryButton
              label="Finish walkthrough only"
              disabled={!canFinish || busy}
              onPress={() => void finishWalkthrough(false)}
            />
          </View>
        ) : jobStatus === 'scheduled' ? (
          <PrimaryButton
            label={busy ? 'Starting…' : 'Start job'}
            loading={busy}
            onPress={() => void finishWalkthrough(true)}
          />
        ) : (
          <SecondaryButton label="Export inspection PDF" onPress={() => void exportPdf()} />
        )}
      </ScrollView>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
  },
  banner: {
    backgroundColor: colors.surfaceActive,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
  },
  vehicleRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  vehicleOn: {
    borderColor: colors.green,
    backgroundColor: colors.surfaceActive,
  },
  pressed: { opacity: 0.85 },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  footerActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
})
