import { useCallback, useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { FileText } from 'phosphor-react-native'
import { fmt } from '@rinse/core'
import type { QuoteWithRelations } from '@rinse/core'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import {
  AppFlashList,
  AppText,
  EmptyState,
  HeaderAction,
  ListRow,
  ScreenLoading,
  StaggeredListItem,
} from '@/src/components/ui'
import { listQuotes } from '@/src/lib/quotes-api'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { colors, iconTonePalette } from '@/src/theme/colors'

export default function QuotesListScreen() {
  const router = useRouter()
  const goBack = useSafeBack()
  const dockPadding = useTabDockPadding()
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      setQuotes(await listQuotes())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  return (
    <OperatorScreen
      title="Quotes"
      subtitle={`${quotes.length} total`}
      onBack={goBack}
      headerRight={
        <View style={styles.headerActions}>
          <HeaderAction label="Scan" onPress={() => router.push('/scan')} />
          <HeaderAction label="+ New" onPress={() => router.push('/quotes/new')} />
        </View>
      }
    >
      {loading ? (
        <ScreenLoading variant="list" />
      ) : quotes.length === 0 ? (
        <EmptyState
          illustration="jobs"
          title="No quotes yet"
          description="Send price estimates to clients before scheduling a job."
          actionLabel="New quote"
          onAction={() => router.push('/quotes/new')}
        />
      ) : (
        <AppFlashList
          data={quotes}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />}
          renderItem={({ item, index }) => (
            <StaggeredListItem index={index}>
              <ListRow
                icon={<FileText size={18} color={iconTonePalette.blue.fg} weight="duotone" />}
                iconTone="blue"
                title={item.client?.name ?? 'Client'}
                subtitle={`${item.quote_number || 'Draft'} · ${item.status}`}
                meta={fmt(item.subtotal)}
                onPress={() => router.push(`/quotes/${item.id}`)}
              />
            </StaggeredListItem>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: dockPadding }]}
        />
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {},
})
