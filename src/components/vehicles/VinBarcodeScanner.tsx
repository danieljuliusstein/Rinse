import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Lightning, X } from 'phosphor-react-native'
import { AppText, SecondaryButton } from '@/src/components/ui'
import { extractVinCandidate } from '@/src/lib/vin-decode'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const VIN_BARCODE_TYPES = ['code39', 'code128', 'code93', 'pdf417', 'datamatrix', 'qr'] as const

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
  const handledRef = useRef(false)
  const cooldownRef = useRef(0)

  useEffect(() => {
    if (!visible) {
      setTorch(false)
      setCameraReady(false)
      return
    }
    handledRef.current = false
    setError(null)
    cooldownRef.current = 0
    if (!permission?.granted) void requestPermission()
  }, [visible, permission?.granted, requestPermission])

  const handleScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!cameraReady || handledRef.current) return
      const now = Date.now()
      if (now - cooldownRef.current < 800) return
      cooldownRef.current = now

      const candidate = extractVinCandidate(data)
      if (!candidate) {
        setError('Scanned code is not a valid 17-character VIN. Try again or use photo scan.')
        return
      }
      handledRef.current = true
      onVin(candidate)
      onClose()
    },
    [cameraReady, onClose, onVin],
  )

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>Scan VIN barcode</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {!permission?.granted ? (
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
                setError(e.message || 'Camera failed to start — try photo scan instead.')
              }}
            />
            <View style={styles.frame} pointerEvents="none" />
            <AppText variant="caption" style={styles.hint}>
              {!cameraReady ? 'Starting camera…' : 'Align the VIN barcode inside the frame'}
            </AppText>
          </View>
        )}

        {error ? (
          <AppText variant="caption" style={styles.error} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        {permission?.granted ? (
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
              onPress={() => setTorch((v) => !v)}
              disabled={Platform.OS === 'web'}
              style={[styles.torchBtn, torch && styles.torchOn, Platform.OS === 'web' && styles.torchDisabled]}
            >
              <Lightning size={20} color={torch ? '#071407' : colors.textSecondary} weight={torch ? 'fill' : 'regular'} />
            </Pressable>
            {onRequestPhotoScan ? (
              <View style={styles.photoWrap}>
                <SecondaryButton
                  label="Scan from photo instead"
                  onPress={() => {
                    onClose()
                    onRequestPhotoScan()
                  }}
                />
              </View>
            ) : null}
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
    top: '22%',
    left: spacing.lg,
    right: spacing.lg,
    height: '36%',
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
