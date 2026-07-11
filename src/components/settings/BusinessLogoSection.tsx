import { useMemo } from 'react'
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Image as ImageIcon } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui'
import { hasCustomBusinessLogo, resolveBusinessLogoSrc } from '@/src/lib/business-logo'
import { validateLogoAsset } from '@/src/lib/logo-upload'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export type LogoMeta = {
  width: number
  height: number
  format: string
}

function metaSubline(
  logoSrc: string | null,
  logoMeta: LogoMeta | null | undefined,
  uploading: boolean,
): string {
  if (uploading) return 'Uploading…'
  if (!logoSrc) return 'No logo uploaded'
  if (logoMeta && logoMeta.width > 0 && logoMeta.height > 0) {
    return `${logoMeta.format.toUpperCase()} · ${logoMeta.width} × ${logoMeta.height}`
  }
  if (logoMeta?.format) return logoMeta.format.toUpperCase()
  return 'Logo uploaded'
}

export function BusinessLogoSection({
  logoUrl,
  previewUri,
  businessName,
  logoMeta,
  uploading = false,
  removing = false,
  error,
  onUpload,
  onRemove,
}: {
  logoUrl?: string | null
  previewUri?: string | null
  businessName: string
  logoMeta?: LogoMeta | null
  uploading?: boolean
  removing?: boolean
  error?: string | null
  onUpload: (asset: ImagePicker.ImagePickerAsset) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const logoSrc = previewUri ?? resolveBusinessLogoSrc(logoUrl) ?? null
  const showRemove = Boolean(logoSrc) && !uploading && hasCustomBusinessLogo(logoUrl)

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Photos access needed', 'Allow photo library access to upload your logo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const validationError = validateLogoAsset(asset)
    if (validationError) {
      Alert.alert('Invalid logo', validationError)
      return
    }
    await onUpload(asset)
  }

  const confirmRemove = () => {
    Alert.alert(
      'Remove logo?',
      'Remove your custom logo? The default mark will be used until you upload a new one.',
      [
        { text: 'Keep logo', style: 'cancel' },
        { text: 'Remove logo', style: 'destructive', onPress: () => void onRemove() },
      ],
    )
  }

  const subline = useMemo(() => metaSubline(logoSrc, logoMeta, uploading), [logoMeta, logoSrc, uploading])

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.thumb, uploading ? styles.thumbBusy : null]}>
          {logoSrc ? (
            <Image source={{ uri: logoSrc }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <ImageIcon size={22} color={colors.textMuted} weight="duotone" />
            </View>
          )}
          {uploading ? <View style={styles.thumbOverlay} /> : null}
        </View>

        <View style={styles.meta}>
          <AppText style={styles.name} numberOfLines={1}>
            {businessName.trim() || 'Your business'}
          </AppText>
          <AppText style={styles.sub}>{subline}</AppText>
        </View>

        <Pressable
          style={[styles.changeBtn, uploading ? styles.changeBtnBusy : null]}
          onPress={() => void pickLogo()}
          disabled={uploading || removing}
          accessibilityRole="button"
          accessibilityLabel="Change logo"
        >
          <AppText style={styles.changeText}>{uploading ? 'Saving…' : 'Change'}</AppText>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <AppText style={styles.helper}>Shown on invoices, your booking page, and the client portal.</AppText>
        {showRemove ? (
          <Pressable
            style={[styles.removeBtn, removing ? styles.removeBtnBusy : null]}
            onPress={confirmRemove}
            disabled={removing}
            accessibilityRole="button"
          >
            <AppText style={styles.removeText}>{removing ? 'Removing…' : 'Remove logo'}</AppText>
          </Pressable>
        ) : null}
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
      </View>
    </View>
  )
}

export async function logoMetaFromUri(uri: string): Promise<LogoMeta> {
  const ext = uri.split('?')[0].split('.').pop()?.toUpperCase() ?? 'IMG'
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height, format: ext }),
      () => resolve({ width: 0, height: 0, format: ext }),
    )
  })
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  thumb: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumbBusy: {
    opacity: 0.55,
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 11,
    color: colors.textDim,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  changeBtnBusy: {
    opacity: 0.7,
  },
  changeText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.greenText,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bottom: {
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  helper: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textDim,
  },
  removeBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  removeBtnBusy: {
    opacity: 0.6,
  },
  removeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
  },
})
