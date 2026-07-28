import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { ReceiptHeuristicLine } from '@rinse/core'
import { parseReceiptHeuristics } from '@rinse/core'
import { ReceiptReviewChecklist } from '@/src/components/expenses/ReceiptReviewChecklist'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { AppSheet } from '@/src/components/ui/AppSheet'
import type { ReceiptImageAsset } from '@/src/lib/business-expenses-api'
import { launchCameraSafe, launchLibrarySafe } from '@/src/lib/pick-image'
import { includedLinesToExpenseLines } from '@/src/lib/receipt-parse'
import { recognizeReceiptText } from '@/src/lib/receipt-ocr'
import { setReceiptReviewDraft } from '@/src/lib/receipt-review-draft'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { colors, spacing } from '@/src/theme/colors'

export default function ReceiptReviewScreen() {
  const router = useRouter()
  const goBack = useSafeBack('/scan')
  const params = useLocalSearchParams<{ returnTo?: string }>()
  const returnToSheet = params.returnTo === 'sheet'

  const [image, setImage] = useState<ReceiptImageAsset | null>(null)
  const [busy, setBusy] = useState(false)
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState('')
  const [total, setTotal] = useState('')
  const [lines, setLines] = useState<ReceiptHeuristicLine[]>([])
  const [manualMessage, setManualMessage] = useState<string | null>(null)

  const generation = useRef(0)
  const webStarted = useRef(false)

  const applyImage = async (asset: ReceiptImageAsset) => {
    const gen = ++generation.current
    setImage(asset)
    setBusy(true)
    setManualMessage(null)
    setMerchant('')
    setDate('')
    setTotal('')
    setLines([])
    try {
      const text = await recognizeReceiptText(asset.uri)
      if (gen !== generation.current) return
      if (!text) {
        setManualMessage('Enter lines manually')
        return
      }
      const heuristics = parseReceiptHeuristics(text)
      setMerchant(heuristics.merchant ?? '')
      setDate(heuristics.date ?? '')
      setTotal(heuristics.total != null && heuristics.total > 0 ? String(heuristics.total) : '')
      setLines(heuristics.lines)
    } finally {
      if (gen === generation.current) setBusy(false)
    }
  }

  const takePhoto = () => {
    void (async () => {
      const result = await launchCameraSafe({ mediaTypes: ['images'], quality: 0.85 })
      if (!result || result.canceled || !result.assets[0]?.uri) return
      const asset = result.assets[0]
      await applyImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? undefined,
      })
    })()
  }

  const chooseLibrary = () => {
    void (async () => {
      const result = await launchLibrarySafe({ mediaTypes: ['images'], quality: 0.85 })
      if (!result || result.canceled || !result.assets[0]?.uri) return
      const asset = result.assets[0]
      await applyImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? undefined,
      })
    })()
  }

  useEffect(() => {
    return () => {
      generation.current += 1
    }
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || webStarted.current || image) return
    webStarted.current = true
    const timer = setTimeout(() => chooseLibrary(), 400)
    return () => clearTimeout(timer)
    // Intentional: open library once on web.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  const handleContinue = () => {
    if (!image) return
    const parsedTotal = Number(total) || 0
    setReceiptReviewDraft({
      image,
      merchant: merchant.trim() || undefined,
      date: date.trim() || undefined,
      total: parsedTotal > 0 ? parsedTotal : undefined,
      lines: includedLinesToExpenseLines(lines),
      manualMessage: manualMessage ?? undefined,
    })
    if (returnToSheet) {
      goBack()
      return
    }
    router.replace('/expenses/new?fromReview=1')
  }

  return (
    <AppSheet
      title="Review receipt"
      subtitle="Confirm merchant, total, and which lines to keep"
      onClose={goBack}
    >
      <View style={styles.body}>
        {!image ? (
          <View style={styles.capture}>
            <AppText variant="caption" style={styles.hint}>
              Take a photo or upload from your library. The image stays with this expense.
            </AppText>
            <View style={styles.actions}>
              <PrimaryButton label="Take photo" onPress={takePhoto} style={styles.btn} />
              <SecondaryButton label="Upload" onPress={chooseLibrary} style={styles.btn} />
            </View>
          </View>
        ) : busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.green} />
            <AppText variant="caption" style={styles.hint}>
              Reading receipt…
            </AppText>
          </View>
        ) : (
          <ReceiptReviewChecklist
            previewUri={image.uri}
            merchant={merchant}
            date={date}
            total={total}
            lines={lines}
            manualMessage={manualMessage}
            onMerchantChange={setMerchant}
            onDateChange={setDate}
            onTotalChange={setTotal}
            onLinesChange={setLines}
            onContinue={handleContinue}
          />
        )}
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  capture: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
  busy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
})
