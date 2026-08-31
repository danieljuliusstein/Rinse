import { ActivityIndicator, StyleSheet, View, Pressable, Alert } from 'react-native'
import { CloudRain, Sun, WarningCircle } from 'phosphor-react-native'
import { AppText, Badge } from '@/src/components/ui'
import type { WeatherReadinessResult, WeatherReadinessRow } from '@/src/lib/weather-readiness'
import {
  WEATHER_READINESS_EMPTY_MESSAGE,
  WEATHER_READINESS_NO_ADDRESS_MESSAGE,
  WEATHER_READINESS_OFFLINE_MESSAGE,
  WEATHER_READINESS_UNRESOLVED_MESSAGE,
  weatherReadinessCompactSummary,
  weatherReadinessPartialNote,
} from '@/src/lib/weather-readiness'
import { colors, radii, spacing } from '@/src/theme/colors'

type WeatherReadinessCardProps = {
  result: WeatherReadinessResult | null
  loading?: boolean
  /** Home summary — icon + headline. */
  compact?: boolean
  /** Optional refresh handler triggered by the UI. */
  onRefresh?: () => Promise<void>
}

function ForecastRow({ row }: { row: WeatherReadinessRow }) {
  const isRisk = row.kind === 'risk'
  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <AppText variant="bodySemiBold">{row.primary}</AppText>
        {row.secondary ? <AppText variant="caption">{row.secondary}</AppText> : null}
      </View>
      {row.statusLabel ? (
        <Badge tone={isRisk ? 'amber' : 'green'} label={row.statusLabel} />
      ) : null}
    </View>
  )
}

export function WeatherReadinessCard({ result, loading, compact = false, onRefresh }: WeatherReadinessCardProps) {
  if (compact) {
    if (loading) {
      return (
        <View style={[styles.compactCard, styles.compactClear]} accessibilityRole="summary">
          <View style={styles.compactInner}>
            <ActivityIndicator size="small" color={colors.greenText} />
            <AppText variant="bodySemiBold" style={styles.compactTitle}>
              Checking forecast…
            </AppText>
          </View>
        </View>
      )
    }

    const compactSummary = weatherReadinessCompactSummary(result)
    // #region agent log
    fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35195'},body:JSON.stringify({sessionId:'a35195',runId:'pre-fix',hypothesisId:'A',location:'WeatherReadinessCard.tsx:compact',message:'Compact card render path',data:{compact:true,loading:false,status:result?.status??null,rowCount:result?.rows?.length??0,rowPrimaries:(result?.rows??[]).map(r=>r.primary),summaryHeadline:compactSummary?.headline??null,summaryTone:compactSummary?.tone??null,showsForecastRows:false},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!compactSummary) return null

    const Icon =
      compactSummary.tone === 'risk'
        ? CloudRain
        : compactSummary.tone === 'unresolved'
          ? WarningCircle
          : Sun
    const iconColor =
      compactSummary.tone === 'risk'
        ? '#3b6fc4'
        : compactSummary.tone === 'unresolved'
          ? colors.amber
          : colors.green
    const cardTone =
      compactSummary.tone === 'risk'
        ? styles.compactRisk
        : compactSummary.tone === 'unresolved'
          ? styles.compactUnresolved
          : styles.compactClear

    const showRows =
      Boolean(result?.rows.length) &&
      (result?.status === 'ready' || result?.status === 'partial')

    // #region agent log
    fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35195'},body:JSON.stringify({sessionId:'a35195',runId:'post-fix',hypothesisId:'A',location:'WeatherReadinessCard.tsx:compact:render',message:'Compact card with forecast rows decision',data:{showRows,status:result?.status??null,rowCount:result?.rows?.length??0,headline:compactSummary.headline},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return (
      <View style={[styles.compactCard, cardTone]} accessibilityRole="summary">
        <View style={styles.compactInner}>
          <Icon size={18} color={iconColor} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.compactTitle}>
            {compactSummary.headline}
          </AppText>
          <Pressable
            onPress={async () => {
              if (onRefresh) {
                try {
                  await onRefresh()
                } catch {
                  Alert.alert('Refresh failed', 'Could not refresh forecast')
                }
              } else {
                Alert.alert('Refresh', 'Pull-to-refresh the Home screen to update the forecast')
              }
            }}
            style={{ marginLeft: 8 }}
          >
            <AppText variant="caption">Refresh</AppText>
          </Pressable>
        </View>
        {showRows ? (
          <View style={styles.compactRows}>
            {result!.rows.map((row) => (
              <ForecastRow key={row.kind === 'risk' ? row.jobId : row.date} row={row} />
            ))}
          </View>
        ) : null}
        {result?.status === 'partial' && result.unresolvedCount ? (
          <AppText variant="caption" style={styles.partialNote}>
            {weatherReadinessPartialNote(result.unresolvedCount)}
          </AppText>
        ) : null}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color={colors.greenText} />
          <AppText variant="bodySemiBold" style={styles.title}>
            Checking forecast…
          </AppText>
        </View>
      </View>
    )
  }

  if (!result) return null

  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35195'},body:JSON.stringify({sessionId:'a35195',runId:'post-fix',hypothesisId:'H',location:'WeatherReadinessCard.tsx:full',message:'Full card render path',data:{compact:false,status:result.status,rowCount:result.rows.length,rowPrimaries:result.rows.map(r=>r.primary),willShowRows:result.status==='ready'||result.status==='partial'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
      <View style={styles.card}>
      {result.status === 'no_jobs' ? (
        <View style={styles.header}>
          <Sun size={22} color={colors.green} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.title}>
            {WEATHER_READINESS_EMPTY_MESSAGE}
          </AppText>
          <Pressable
            onPress={async () => {
              if (onRefresh) {
                try {
                  await onRefresh()
                } catch {
                  Alert.alert('Refresh failed', 'Could not refresh forecast')
                }
              } else {
                Alert.alert('Refresh', 'Pull-to-refresh the Home screen to update the forecast')
              }
            }}
            style={{ marginLeft: 8 }}
          >
            <AppText variant="caption">Refresh</AppText>
          </Pressable>
        </View>
      ) : null}

      {result.status === 'unresolved' ? (
        <View style={styles.header}>
          <WarningCircle size={22} color={colors.amber} weight="duotone" />
          <AppText variant="bodySemiBold" style={styles.title}>
            {result.reason === 'no_address'
              ? WEATHER_READINESS_NO_ADDRESS_MESSAGE
              : result.reason === 'offline'
                ? WEATHER_READINESS_OFFLINE_MESSAGE
                : WEATHER_READINESS_UNRESOLVED_MESSAGE}
          </AppText>
        </View>
      ) : null}

      {result.status === 'ready' || result.status === 'partial' ? (
        <View
          style={styles.rows}
          onLayout={(e) => {
            // #region agent log
            fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a35195'},body:JSON.stringify({sessionId:'a35195',runId:'post-fix',hypothesisId:'G',location:'WeatherReadinessCard.tsx:rows:onLayout',message:'Forecast rows laid out',data:{height:e.nativeEvent.layout.height,width:e.nativeEvent.layout.width,rowCount:result.rows.length},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
          }}
        >
          {result.rows.map((row, index) => (
            <ForecastRow
              key={row.kind === 'risk' ? `${row.jobId}-${index}` : `${row.date ?? row.primary}-${index}`}
              row={row}
            />
          ))}
        </View>
      ) : null}

      {result.status === 'partial' && result.unresolvedCount ? (
        <AppText variant="caption" style={styles.partialNote}>
          {weatherReadinessPartialNote(result.unresolvedCount)}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  compactCard: {
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactRisk: {
    backgroundColor: '#eef3fc',
    borderColor: '#cfe0f7',
  },
  compactClear: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  compactUnresolved: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  compactTitle: {
    flex: 1,
    fontSize: 15,
  },
  compactRows: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  partialNote: {
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
})
