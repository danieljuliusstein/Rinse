import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, Lightning, X } from 'phosphor-react-native'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { ocrVehicleImage, type VehicleOcrTarget } from '@/src/lib/vehicle-ocr'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type VehiclePhotoScannerProps = {
  visible: boolean
  title: string
  hint: string
  target: VehicleOcrTarget
  onClose: () => void
  onResult: (result: { plate: string | null; vin: string | null }) => void
}

/**
 * Capture a still photo and OCR plate/VIN via the app API.
 * Used for license plates (not barcodes) and as a VIN fallback.
 */
export function VehiclePhotoScanner({
  visible,
  title,
  hint,
  target,
  onClose,
  onResult,
}: VehiclePhotoScannerProps) {
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [torch, setTorch] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setBusy(false)
      setError(null)
      setTorch(false)
      return
    }
    if (!permission?.granted) void requestPermission()
  }, [visible, permission?.granted, requestPermission])

  const capture = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      })
      if (!photo?.uri) throw new Error('Could not capture photo')

      const result = await ocrVehicleImage(photo.uri, 'image/jpeg', target)
      if (target === 'plate' && !result.plate) throw new Error('Could not read a license plate')
      if (target === 'vin' && !result.vin) throw new Error('Could not read a VIN')
      onResult(result)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }, [busy, onClose, onResult, target])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>{title}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!permission?.granted ? (
          <View style={styles.permission}>
            <AppText style={styles.permissionText}>
              Allow camera access to photograph the {target === 'vin' ? 'VIN sticker' : 'license plate'}.
            </AppText>
            <SecondaryButton label="Allow camera" onPress={() => void requestPermission()} />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              enableTorch={torch}
            />
            <View style={styles.frame} pointerEvents="none" />
            <AppText variant="caption" style={styles.hint}>
              {hint}
            </AppText>
          </View>
        )}

        {error ? (
          <AppText variant="caption" style={styles.error} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        {permission?.granted ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
              onPress={() => setTorch((v) => !v)}
              style={[styles.torchBtn, torch && styles.torchOn]}
            >
              <Lightning size={20} color={torch ? '#071407' : colors.textSecondary} weight={torch ? 'fill' : 'regular'} />
            </Pressable>
            <View style={styles.captureWrap}>
              <PrimaryButton
                label={busy ? 'Reading…' : 'Capture'}
                loading={busy}
                onPress={() => void capture()}
                disabled={busy}
              />
            </View>
            {busy ? <ActivityIndicator color={colors.green} style={styles.spinner} /> : <Camera size={22} color={colors.textMuted} />}
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
  },
  close: {
    padding: 8,
  },
  permission: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  permissionText: {
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  cameraWrap: {
    flex: 1,
    gap: spacing.sm,
  },
  camera: {
    flex: 1,
    borderRadius: radii.sheet,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    top: '28%',
    left: spacing.lg,
    right: spacing.lg,
    height: '28%',
    borderWidth: 2,
    borderColor: colors.green,
    borderRadius: radii.lg,
  },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  torchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  torchOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  captureWrap: {
    flex: 1,
  },
  spinner: {
    width: 22,
  },
})
