import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'
import { fmt } from '@rinse/core'
import type { WaterfallData } from '@/src/lib/reports-metrics'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

interface WaterfallChartProps {
  data: WaterfallData
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const chartWidth = 320
  const chartHeight = 180
  const padLeft = 8
  const padRight = 8
  const padTop = 8
  const padBottom = 28
  const innerW = chartWidth - padLeft - padRight
  const innerH = chartHeight - padTop - padBottom
  const barGap = 8
  const barW = Math.max(24, (innerW - barGap * (data.labels.length - 1)) / data.labels.length)
  const yMin = data.yMin ?? 0
  const yMax = data.yMax || 1
  const span = Math.max(yMax - yMin, 1)

  const yFor = (v: number) => padTop + innerH - ((v - yMin) / span) * innerH

  // #region agent log
  fetch('http://127.0.0.1:7518/ingest/3eb366ac-7592-4deb-adb1-83908dfd0476',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5e97ca'},body:JSON.stringify({sessionId:'5e97ca',runId:'post-fix',hypothesisId:'WF1',location:'WaterfallChart.tsx',message:'Waterfall scale',data:{yMin,yMax,span,labels:data.labels,ranges:data.ranges,vals:data.vals},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {yMin < 0 && yMax > 0 ? (
          <Line
            x1={padLeft}
            y1={yFor(0)}
            x2={chartWidth - padRight}
            y2={yFor(0)}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}
        {data.labels.map((label, i) => {
          const [lo, hi] = data.ranges[i]
          const x = padLeft + i * (barW + barGap)
          const yTop = yFor(hi)
          const yBottom = yFor(lo)
          const h = Math.max(3, Math.abs(yBottom - yTop))

          return (
            <React.Fragment key={`${label}-${i}`}>
              <Rect
                x={x}
                y={Math.min(yTop, yBottom)}
                width={barW}
                height={h}
                fill={data.colors[i]}
                rx={4}
              />
              <SvgText
                x={x + barW / 2}
                y={chartHeight - 6}
                fill={colors.textMuted}
                fontSize={9}
                textAnchor="middle"
              >
                {label.length > 10 ? `${label.slice(0, 9)}…` : label}
              </SvgText>
              {i < data.labels.length - 1 ? (
                <Line
                  x1={x + barW}
                  y1={yFor(hi)}
                  x2={x + barW + barGap}
                  y2={yFor(data.ranges[i + 1][1])}
                  stroke={colors.border}
                  strokeWidth={1}
                />
              ) : null}
            </React.Fragment>
          )
        })}
      </Svg>
      <View style={styles.legend}>
        {data.labels.map((label, i) => (
          <View key={`${label}-legend-${i}`} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: data.colors[i] }]} />
            <AppText variant="caption" style={styles.legendLabel}>
              {label}
            </AppText>
            <AppText variant="bodySemiBold" style={styles.legendValue}>
              {fmt(data.vals[i])}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  legend: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
    color: colors.textMuted,
  },
  legendValue: {
    fontSize: 14,
  },
})
