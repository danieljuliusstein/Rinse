import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { smoothAreaPath, smoothPath } from '@/src/lib/smooth-path'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type ProfitHeroProps = {
  netProfit: number
  growthPct: number | null
  sparkline: number[]
  caption: string
}

function TrendSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(0, ...points)
  const range = max - min || 1
  const w = 280
  const h = 48
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => ({
    x: i * step,
    y: h - ((p - min) / range) * (h - 8) - 4,
  }))
  const linePath = smoothPath(coords)
  const areaPath = smoothAreaPath(coords, w, h)
  const last = coords[coords.length - 1]

  return (
    <Svg width="100%" height={48} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Path d={areaPath} fill="#22c55e" fillOpacity={0.18} />
      <Path
        d={linePath}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={last.x} cy={last.y} r={4} fill="#22c55e" stroke="#ffffff" strokeWidth={2.5} />
    </Svg>
  )
}

export function ProfitHero({ netProfit, growthPct, sparkline, caption }: ProfitHeroProps) {
  const isProfit = netProfit > 0
  const isLoss = netProfit < 0
  const isFlat = netProfit === 0
  const displayed = fmt(netProfit)
  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'post-fix',hypothesisId:'PL1',location:'ProfitHero.tsx',message:'Hero P/L display mapping',data:{netProfit,isProfit,isLoss,isFlat,label:isLoss?'Net loss':isFlat?'Net':'Net profit',displayed,usesAbs:false,growthPct,sparkLen:sparkline.length,caption},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <View style={[styles.card, isLoss ? styles.loss : styles.profit]}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, isLoss ? styles.dotLoss : styles.dotProfit]} />
        <AppText style={styles.label}>{isLoss ? 'Net loss' : isFlat ? 'Net' : 'Net profit'}</AppText>
      </View>

      <View style={styles.amountRow}>
        <AppText style={[styles.amount, isLoss && styles.amountLoss]}>{displayed}</AppText>
        {growthPct != null ? (
          <View style={styles.growthCol}>
            <AppText style={[styles.growth, growthPct < 0 && styles.growthDown]}>
              {growthPct >= 0 ? '+' : ''}
              {growthPct}%
            </AppText>
            <AppText style={styles.growthSub}>vs prior period</AppText>
          </View>
        ) : null}
      </View>

      {!isLoss && sparkline.length >= 2 ? (
        <View style={styles.sparkWrap}>
          <TrendSparkline points={sparkline} />
        </View>
      ) : null}

      <AppText style={styles.caption}>{caption}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 4,
    overflow: 'hidden',
  },
  profit: {
    backgroundColor: '#effdf4',
    borderColor: '#dcfce7',
  },
  loss: {
    backgroundColor: '#fff1f2',
    borderColor: '#ffe4e6',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotProfit: {
    backgroundColor: colors.green,
  },
  dotLoss: {
    backgroundColor: '#f43f5e',
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amountRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  amount: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  amountLoss: {
    color: '#e11d48',
  },
  growthCol: {
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  growth: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: '#16a34a',
  },
  growthDown: {
    color: '#e11d48',
  },
  growthSub: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  sparkWrap: {
    marginTop: 12,
  },
  caption: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
})
