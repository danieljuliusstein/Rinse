import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Images, Trash } from 'phosphor-react-native'
import type { JobPhoto, PhotoType } from '@rinse/core'
import {
  countJobPhotosByType,
  jobHasBeforeAndAfter,
  jobPhotoCompletenessMessage,
  jobPhotoLimitMessage,
} from '@rinse/core'
import { deleteJobPhoto, getJobPhotos, uploadJobPhoto } from '@/src/lib/invoices-api'
import { photoMimeType, photoUploadFilename } from '@/src/lib/form-data-file'
import { launchCameraSafe, launchLibrarySafe, prepareLocalPhotoUri } from '@/src/lib/pick-image'
import { shareTransformationPdf } from '@/src/lib/share'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
]

export default function JobPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [photoType, setPhotoType] = useState<PhotoType>('after')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    const rows = await getJobPhotos(id)
    setPhotos(rows)
  }, [id])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load photos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const filtered = useMemo(() => photos.filter((p) => p.type === photoType), [photos, photoType])
  const counts = useMemo(() => countJobPhotosByType(photos), [photos])
  const complete = jobHasBeforeAndAfter(photos)

  const exportTransformation = async () => {
    if (!id) return
    if (!complete) {
      Alert.alert('Need before & after', jobPhotoCompletenessMessage(counts))
      return
    }
    setUploading(true)
    try {
      await shareTransformationPdf(id)
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'Export failed')
    } finally {
      setUploading(false)
    }
  }

  const pickAndUpload = async (source: 'camera' | 'library') => {
    const jobId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined
    if (!jobId) return

    const result =
      source === 'camera'
        ? await launchCameraSafe({ quality: 0.85 })
        : await launchLibrarySafe({ quality: 0.85 })

    if (!result || result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    const filename = photoUploadFilename(
      asset.uri,
      asset.fileName ?? `${photoType}-${Date.now()}.jpg`,
    )
    const mimeType = photoMimeType(filename, asset.mimeType)

    setUploading(true)
    try {
      const localUri = await prepareLocalPhotoUri(asset.uri, `job-photos/${jobId}`, filename)
      const uploaded = await uploadJobPhoto(jobId, localUri, filename, mimeType, photoType)
      setPhotos((prev) => [...prev.filter((p) => p.filename !== uploaded.filename), uploaded])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      Alert.alert('Upload failed', message.includes('limit') ? jobPhotoLimitMessage(photoType) : message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (filename: string) => {
    if (!id) return
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteJobPhoto(id, filename)
              setPhotos((prev) => prev.filter((p) => p.filename !== filename))
            } catch (e) {
              Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again')
            }
          })()
        },
      },
    ])
  }

  if (loading) return <LoadingState label="Loading photos…" />

  return (
    <OperatorScreen
      title="Job photos"
      subtitle={jobPhotoCompletenessMessage(counts)}
      headerRight={<DetailHeaderActions onBack={() => router.back()} />}
    >
      {error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={[styles.banner, complete ? styles.bannerOk : null]}>
        <AppText variant="caption" style={styles.bannerText}>
          {complete
            ? 'Ready for the transformation PDF — required before sending an invoice.'
            : 'Capture at least one before and one after photo for invoice send.'}
        </AppText>
      </View>

      <PillGroup options={PHOTO_TYPES} value={photoType} onChange={setPhotoType} />

      <View style={styles.actions}>
        <PrimaryButton label="Take photo" loading={uploading} onPress={() => void pickAndUpload('camera')} />
        <PrimaryButton
          label="Choose from library"
          loading={uploading}
          onPress={() => void pickAndUpload('library')}
        />
        <SecondaryButton
          label={complete ? 'Export before/after PDF' : 'Export PDF (need both)'}
          loading={uploading}
          onPress={() => void exportTransformation()}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: dockPadding }]}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Images size={32} color={colors.textMuted} />
            <AppText variant="body" style={styles.emptyText}>
              No {photoType} photos yet
            </AppText>
          </View>
        ) : (
          filtered.map((photo) => (
            <View key={photo.filename} style={styles.tile}>
              <Image source={{ uri: photo.url }} style={styles.image} resizeMode="cover" />
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(photo.filename)}>
                <Trash size={16} color="#fff" weight="bold" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  banner: {
    backgroundColor: colors.surfaceActive,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  bannerOk: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bannerText: {
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    padding: 8,
  },
  empty: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
})
