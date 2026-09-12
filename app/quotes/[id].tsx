import { useLocalSearchParams } from 'expo-router'
import { QuoteDetailBody } from '@/src/components/detail/QuoteDetailBody'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText } from '@/src/components/ui/AppText'
import { colors } from '@/src/theme/colors'

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <AppSheet title="Quote">
        <AppText variant="body" style={{ color: colors.textMuted }}>
          Quote not found
        </AppText>
      </AppSheet>
    )
  }

  return <QuoteDetailBody quoteId={id} />
}
