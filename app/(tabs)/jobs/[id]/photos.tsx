import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Images, Trash } from '@/src/icons'
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
import {
  AppSheet,
  AppText,
  Button,
  PillGroup,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/ui'
import { colors, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
]

type Feedback = { tone: 'error' | 'info'; message: string } | null

export default function JobPhotosScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const jobId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined
  const router = useRouter()
  const dockPadding = useTabDockPadding()
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [photoType, setPhotoType] = useState<PhotoType>('after')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<JobPhoto | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [deleteFeedback, setDeleteFeedback] = useState<Feedback>(null)

  const load = useCallback(async () => {
    if (!jobId) return
    setFeedback(null)
    const rows = await getJobPhotos(jobId)
    setPhotos(rows)
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    void load()
      .catch((e) => {
        if (!cancelled) {
          setFeedback({
            tone: 'error',
            message: e instanceof Error ? e.message : 'Failed to load photos',
          })
        }
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
    if (!jobId) {
      setFeedback({
        tone: 'error',
        message: 'This screen is missing the job ID. Go back and open photos again.',
      })
      return
    }
    if (!complete) {
      setFeedback({ tone: 'info', message: jobPhotoCompletenessMessage(counts) })
      return
    }
    setUploading(true)
    setFeedback(null)
    try {
      await shareTransformationPdf(jobId)
    } catch (e) {
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Export failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const pickAndUpload = async (source: 'camera' | 'library') => {
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
    setFeedback(null)
    try {
      const localUri = await prepareLocalPhotoUri(asset.uri, `job-photos/${jobId}`, filename)
      const uploaded = await uploadJobPhoto(jobId, localUri, filename, mimeType, photoType)
      setPhotos((prev) => [...prev.filter((p) => p.filename !== uploaded.filename), uploaded])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setFeedback({
        tone: 'error',
        message: message.includes('limit') ? jobPhotoLimitMessage(photoType) : message,
      })
    } finally {
      setUploading(false)
    }
  }

  const performDelete = async () => {
    if (!pendingDelete) return

    if (!jobId) {
      setDeleteFeedback({
        tone: 'error',
        message: 'This screen is missing the job ID. Go back and open photos again.',
      })
      return
    }

    setDeleteFeedback(null)
    setDeleting(true)
    try {
      await deleteJobPhoto(jobId, pendingDelete.filename)
      setPhotos((prev) => prev.filter((p) => p.filename !== pendingDelete.filename))
      setPendingDelete(null)
    } catch (e) {
      setDeleteFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Could not delete photo. Try again.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = (photo: JobPhoto) => {
    setDeleteFeedback(null)
    setPendingDelete(photo)
  }

  const closeDeleteSheet = () => {
    if (!deleting) {
      setPendingDelete(null)
      setDeleteFeedback(null)
    }
  }

  if (loading) return <LoadingState label="Loading photos…" />

  return (
    <>
      <OperatorScreen
        title="Job photos"
        subtitle={jobPhotoCompletenessMessage(counts)}
        headerRight={<DetailHeaderActions onBack={() => router.back()} />}
      >
        {feedback ? (
          <View
            style={[styles.feedbackBanner, feedback.tone === 'error' ? styles.feedbackError : styles.feedbackInfo]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <AppText
              variant="body"
              style={feedback.tone === 'error' ? styles.feedbackErrorText : styles.feedbackInfoText}
            >
              {feedback.message}
            </AppText>
          </View>
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete photo"
                  accessibilityState={{ disabled: deleting || pendingDelete !== null }}
                  hitSlop={8}
                  disabled={deleting || pendingDelete !== null}
                  style={[styles.deleteBtn, webInlinePressableReset]}
                  onPress={() => handleDelete(photo)}
                >
                  <Trash size={16} color="#fff" weight="bold" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </OperatorScreen>

      <AppSheet
        presentation="modal"
        visible={pendingDelete !== null}
        title="Delete photo?"
        subtitle={
          pendingDelete
            ? `Remove this ${pendingDelete.type} photo from the job. This can’t be undone.`
            : undefined
        }
        onClose={closeDeleteSheet}
        footer={
          <View style={styles.sheetFooter}>
            <Button
              variant="danger"
              label="Delete photo"
              loading={deleting}
              onPress={() => void performDelete()}
            />
            <SecondaryButton label="Keep photo" onPress={closeDeleteSheet} disabled={deleting} />
          </View>
        }
      >
        {pendingDelete ? (
          <View style={styles.deleteSheetBody}>
            <View style={styles.deletePreview}>
              <Image
                source={{ uri: pendingDelete.url }}
                style={styles.deletePreviewImage}
                resizeMode="cover"
              />
            </View>
            {deleteFeedback ? (
              <View
                style={[styles.feedbackBanner, styles.feedbackError, styles.sheetFeedback]}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <AppText variant="body" style={styles.feedbackErrorText}>
                  {deleteFeedback.message}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </AppSheet>
    </>
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
  feedbackBanner: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackInfo: {
    backgroundColor: colors.surfaceActive,
    borderColor: colors.border,
  },
  feedbackErrorText: {
    color: '#b91c1c',
  },
  feedbackInfoText: {
    color: colors.textSecondary,
  },
  sheetFooter: {
    gap: spacing.sm,
  },
  deleteSheetBody: {
    gap: spacing.md,
  },
  deletePreview: {
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  deletePreviewImage: {
    width: '100%',
    height: '100%',
  },
  sheetFeedback: {
    marginBottom: 0,
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
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    elevation: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    padding: 8,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
})
