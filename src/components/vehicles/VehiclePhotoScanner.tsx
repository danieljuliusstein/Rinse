import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, Images, Lightning, X } from 'phosphor-react-native'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { isOnDeviceVehicleOcrAvailable, ocrVehicleImage, type VehicleOcrTarget } from '@/src/lib/vehicle-ocr'
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
 * Capture a still photo (or pick from library) and OCR plate/VIN on-device
 * (Apple Vision on iOS, ML Kit on Android).
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
  const [cameraReady, setCameraReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ocrAvailable = isOnDeviceVehicleOcrAvailable()

  useEffect(() => {
    if (!visible) {
      setBusy(false)
      setError(null)
      setTorch(false)
      setCameraReady(false)
      return
    }
    if (Platform.OS === 'web') {
      setError('Photo scan needs the iOS or Android app. Type the value instead.')
      return
    }
    if (!ocrAvailable) {
      setError('On-device OCR needs a rebuilt native app (expo-mlkit-ocr).')
      return
    }
    if (!permission?.granted) void requestPermission()
  }, [visible, permission?.granted, requestPermission, ocrAvailable])

  const runOcr = useCallback(
    async (uri: string) => {
      const result = await ocrVehicleImage(uri, 'image/jpeg', target)
      if (target === 'plate' && !result.plate) throw new Error('Could not read a license plate')
      if (target === 'vin' && !result.vin) throw new Error('Could not read a VIN')
      onResult(result)
      onClose()
    },
    [onClose, onResult, target],
  )

  const capture = useCallback(async () => {
    if (busy || !cameraReady || !ocrAvailable) return
    setBusy(true)
    setError(null)
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.75,
        exif: false,
      })
      if (!photo?.uri) throw new Error('Could not capture photo — wait for the camera to finish starting')
      await runOcr(photo.uri)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }, [busy, cameraReady, ocrAvailable, runOcr])

  const pickFromLibrary = useCallback(async () => {
    if (busy || !ocrAvailable) return
    setBusy(true)
    setError(null)
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Enable photo library access in Settings.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
        mediaTypes: ['images'],
      })
      if (result.canceled || !result.assets[0]) return
      await runOcr(result.assets[0].uri)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }, [busy, ocrAvailable, runOcr])

  if (!visible) return null

  const nativeReady = Platform.OS !== 'web' && ocrAvailable

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>{title}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!nativeReady ? (
          <View style={styles.permission}>
            <AppText style={styles.permissionText}>
              {Platform.OS === 'web'
                ? 'Photo scan needs the iOS or Android app. Close this screen and type the plate or VIN instead.'
                : 'On-device OCR is not in this build. Rebuild the native app after adding expo-mlkit-ocr, then try again.'}
            </AppText>
            <SecondaryButton label="Close" onPress={onClose} />
          </View>
        ) : !permission?.granted ? (
          <View style={styles.permission}>
            <AppText style={styles.permissionText}>
              Allow camera access to photograph the {target === 'vin' ? 'VIN sticker' : 'license plate'}.
            </AppText>
            <SecondaryButton label="Allow camera" onPress={() => void requestPermission()} />
            <SecondaryButton label="Use photo library instead" onPress={() => void pickFromLibrary()} />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              enableTorch={torch}
              onCameraReady={() => setCameraReady(true)}
              onMountError={(e) => {
                setCameraReady(false)
                setError(e.message || 'Camera failed to start')
              }}
            />
            <View style={styles.frame} pointerEvents="none" />
            <AppText variant="caption" style={styles.hint}>
              {!cameraReady ? 'Starting camera…' : hint}
            </AppText>
          </View>
        )}

        {error ? (
          <AppText variant="caption" style={styles.error} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        {nativeReady && permission?.granted ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
              onPress={() => setTorch((v) => !v)}
              style={[styles.iconBtn, torch && styles.torchOn]}
            >
              <Lightning size={20} color={torch ? '#071407' : colors.textSecondary} weight={torch ? 'fill' : 'regular'} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose from library"
              onPress={() => void pickFromLibrary()}
              disabled={busy}
              style={styles.iconBtn}
            >
              <Images size={20} color={colors.textSecondary} weight="duotone" />
            </Pressable>
            <View style={styles.captureWrap}>
              <PrimaryButton
                label={busy ? 'Reading…' : cameraReady ? 'Capture' : 'Starting…'}
                loading={busy}
                onPress={() => void capture()}
                disabled={busy || !cameraReady}
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
  iconBtn: {
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
