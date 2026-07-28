import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CaretDown, CaretUp, Lightning, X } from 'phosphor-react-native'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { extractVinCandidate, isValidVin, normalizeVin } from '@/src/lib/vin-decode'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const VIN_BARCODE_TYPES = ['code39', 'code128', 'code93', 'pdf417', 'datamatrix', 'qr'] as const

function barcodePayloadData(payload: BarcodeScanningResult | { data?: string } | { nativeEvent?: { data?: string } }): string | undefined {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && typeof payload.data === 'string') return payload.data
    if ('nativeEvent' in payload && typeof payload.nativeEvent?.data === 'string') {
      return payload.nativeEvent.data
    }
  }
  return undefined
}

export function VinBarcodeScanner({
  visible,
  onClose,
  onVin,
  onRequestPhotoScan,
}: {
  visible: boolean
  onClose: () => void
  onVin: (vin: string) => void
  /** Optional fallback when barcode scan fails (photo OCR). */
  onRequestPhotoScan?: () => void
}) {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [error, setError] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [manualOpen, setManualOpen] = useState(Platform.OS === 'web')
  const [manualVin, setManualVin] = useState('')
  const handledRef = useRef(false)
  const cooldownRef = useRef(0)

  useEffect(() => {
    if (!visible) {
      setTorch(false)
      setCameraReady(false)
      setManualVin('')
      setError(null)
      setManualOpen(Platform.OS === 'web')
      return
    }
    handledRef.current = false
    setError(null)
    cooldownRef.current = 0
    if (!permission?.granted) void requestPermission()
    // Web / some devices never fire onCameraReady — enable scanning anyway after a beat.
    const readyFallback = setTimeout(() => setCameraReady(true), 600)
    return () => clearTimeout(readyFallback)
  }, [visible, permission?.granted, requestPermission])

  const submitVin = useCallback(
    (raw: string) => {
      if (handledRef.current) return
      const candidate = extractVinCandidate(raw) ?? (isValidVin(raw) ? normalizeVin(raw) : null)
      if (!candidate) {
        setError('Need a valid 17-character VIN (no I, O, or Q).')
        return
      }
      handledRef.current = true
      onVin(candidate)
      onClose()
    },
    [onClose, onVin],
  )

  const handleScanned = useCallback(
    (payload: BarcodeScanningResult | { data?: string } | { nativeEvent?: { data?: string } }) => {
      if (handledRef.current) return
      const data = barcodePayloadData(payload)
      if (!data) return
      const now = Date.now()
      if (now - cooldownRef.current < 800) return
      cooldownRef.current = now

      const candidate = extractVinCandidate(data)
      if (!candidate) {
        const preview = normalizeVin(data).slice(0, 24)
        setError(
          preview
            ? `Read “${preview}” but it’s not a valid VIN. Try again, photo, or type it.`
            : 'Scanned code is not a valid 17-character VIN. Try again, use photo, or type it.',
        )
        setManualOpen(true)
        return
      }
      submitVin(candidate)
    },
    [submitVin],
  )

  if (!visible) return null

  const cameraGranted = permission?.granted === true

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>Scan VIN</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!cameraGranted ? (
          <View style={styles.permission}>
            <AppText style={styles.permissionText}>
              Allow camera access to scan the VIN barcode on the door jamb or windshield.
            </AppText>
            <SecondaryButton label="Allow camera" onPress={() => void requestPermission()} />
            {onRequestPhotoScan ? (
              <SecondaryButton
                label="Scan from photo instead"
                onPress={() => {
                  onClose()
                  onRequestPhotoScan()
                }}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: [...VIN_BARCODE_TYPES] }}
              onBarcodeScanned={cameraReady ? handleScanned : undefined}
              onCameraReady={() => setCameraReady(true)}
              onMountError={(e) => {
                setCameraReady(false)
                setError(e.message || 'Camera failed — type the VIN or use photo scan.')
                setManualOpen(true)
              }}
            />
            <View style={styles.frame} pointerEvents="none" />
            <AppText variant="caption" style={styles.hint}>
              {!cameraReady
                ? 'Starting camera…'
                : Platform.OS === 'web'
                  ? 'Hold the VIN barcode steady in the frame (web scanning is limited)'
                  : 'Align the VIN barcode inside the frame'}
            </AppText>
          </View>
        )}

        {error ? (
          <AppText variant="caption" style={styles.error} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => setManualOpen((v) => !v)}
          style={styles.manualToggle}
        >
          <AppText style={styles.manualToggleLabel}>Or type VIN</AppText>
          {manualOpen ? (
            <CaretUp size={16} color={colors.textSecondary} />
          ) : (
            <CaretDown size={16} color={colors.textSecondary} />
          )}
        </Pressable>

        {manualOpen ? (
          <View style={styles.manualBlock}>
            <TextInput
              style={styles.manualInput}
              value={manualVin}
              onChangeText={(t) => {
                setManualVin(normalizeVin(t).slice(0, 17))
                setError(null)
              }}
              placeholder="17-character VIN"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
            />
            <PrimaryButton
              label="Use this VIN"
              onPress={() => submitVin(manualVin)}
              disabled={manualVin.length < 17}
            />
          </View>
        ) : null}

        <View style={styles.footer}>
          {cameraGranted ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
              onPress={() => setTorch((v) => !v)}
              disabled={Platform.OS === 'web'}
              style={[styles.torchBtn, torch && styles.torchOn, Platform.OS === 'web' && styles.torchDisabled]}
            >
              <Lightning size={20} color={torch ? '#071407' : colors.textSecondary} weight={torch ? 'fill' : 'regular'} />
            </Pressable>
          ) : (
            <View style={styles.torchSpacer} />
          )}
          {onRequestPhotoScan ? (
            <View style={styles.photoWrap}>
              <SecondaryButton
                label="Scan from photo"
                onPress={() => {
                  onClose()
                  onRequestPhotoScan()
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
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
    minHeight: 280,
    gap: spacing.sm,
  },
  camera: {
    flex: 1,
    borderRadius: radii.sheet,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    top: '18%',
    left: spacing.lg,
    right: spacing.lg,
    height: '42%',
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
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  manualToggleLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  manualBlock: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  manualInput: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  footer: {
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
  torchSpacer: {
    width: 44,
  },
  torchDisabled: {
    opacity: 0.4,
  },
  torchOn: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  photoWrap: {
    flex: 1,
  },
})
