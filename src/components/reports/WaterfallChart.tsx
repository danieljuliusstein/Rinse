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
  const yMax = data.yMax || 1

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {data.labels.map((label, i) => {
          const [bottom, top] = data.ranges[i]
          const x = padLeft + i * (barW + barGap)
          const yTop = padTop + innerH - (top / yMax) * innerH
          const yBottom = padTop + innerH - (bottom / yMax) * innerH
          const h = Math.max(2, yBottom - yTop)

          return (
            <React.Fragment key={label}>
              <Rect x={x} y={yTop} width={barW} height={h} fill={data.colors[i]} rx={label === 'Revenue' || label === 'Profit' ? 4 : 2} />
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
                  y1={yTop}
                  x2={x + barW + barGap}
                  y2={yTop}
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
          <View key={label} style={styles.legendRow}>
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
