'use client'

import { useEffect, useRef } from 'react'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js'
import type { WaterfallData } from '@/lib/reports-metrics'
import { readChartTheme } from '@/lib/chart-theme'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

interface WaterfallChartProps {
  data: WaterfallData
  revenue: number
  totalExpenses: number
  netProfit: number
}

function barPixelHeight(chart: Chart, range: [number, number]): number {
  const y = chart.scales.y
  if (!y) return 0
  return Math.abs(y.getPixelForValue(range[0]) - y.getPixelForValue(range[1]))
}

function borderRadiusForBar(
  chart: Chart,
  label: string,
  range: [number, number]
): number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number } {
  const px = barPixelHeight(chart, range)
  if (label === 'Revenue' || label === 'Profit') {
    return { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }
  }
  // Expense bars: no rounding when thin — borderRadius was turning $38/$22 into pills
  if (px < 10) return 0
  return { topLeft: 2, topRight: 2, bottomLeft: 0, bottomRight: 0 }
}

function connectorY(ranges: [number, number][], index: number): number {
  if (index === 0) return ranges[0][1]
  return ranges[index][0]
}

function createConnectorPlugin(ranges: [number, number][], strokeColor: string): Plugin<'bar'> {
  return {
    id: 'waterfallConnectors',
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0)
      if (!meta?.data?.length) return

      const { ctx } = chart
      const y = chart.scales.y
      if (!y) return

      ctx.save()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 1

      for (let i = 0; i < ranges.length - 1; i++) {
        const yVal = connectorY(ranges, i)
        const yPx = y.getPixelForValue(yVal)
        const bar = meta.data[i]
        const next = meta.data[i + 1]
        if (!bar || !next || bar.x == null || next.x == null) continue

        const barW = (bar as { width?: number }).width ?? 0
        const nextW = (next as { width?: number }).width ?? 0

        ctx.beginPath()
        ctx.moveTo(bar.x + barW / 2, yPx)
        ctx.lineTo(next.x - nextW / 2, yPx)
        ctx.stroke()
      }

      ctx.restore()
    },
  }
}

export default function WaterfallChart({ data, revenue, totalExpenses, netProfit }: WaterfallChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    chartRef.current?.destroy()

    const { ranges, vals, colors, labels, yMax } = data
    const theme = readChartTheme()
    const ariaLabel = `Waterfall chart showing revenue of $${revenue.toLocaleString()}, expenses of $${totalExpenses.toLocaleString()}, net profit of $${netProfit.toLocaleString()}`
    const connectorPlugin = createConnectorPlugin(ranges, theme.connector)

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'value',
            data: ranges,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: (ctx) => {
              const label = labels[ctx.dataIndex]
              return label === 'Revenue' || label === 'Profit' ? 1 : 0
            },
            borderRadius: (ctx) => borderRadiusForBar(ctx.chart, labels[ctx.dataIndex], ranges[ctx.dataIndex]),
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 4 } },
        datasets: {
          bar: {
            categoryPercentage: 0.65,
            barPercentage: 0.9,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = vals[ctx.dataIndex]
                const name = labels[ctx.dataIndex]
                const isExpense = name !== 'Revenue' && name !== 'Profit'
                return isExpense ? `-$${val.toLocaleString()}` : `$${val.toLocaleString()}`
              },
            },
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipTitle,
            bodyColor: theme.tooltipBody,
            borderColor: theme.tooltipBorder,
            borderWidth: 0.5,
          },
        },
        scales: {
          x: {
            ticks: {
              color: theme.tick,
              font: { size: 10 },
              autoSkip: false,
              maxRotation: 0,
            },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            min: 0,
            max: yMax,
            ticks: {
              color: theme.tick,
              font: { size: 10 },
              callback: (v) => `$${Number(v).toLocaleString()}`,
            },
            grid: { color: theme.grid, lineWidth: 0.5 },
            border: { display: false },
          },
        },
      },
      plugins: [connectorPlugin],
    }

    chartRef.current = new Chart(canvas, config)
    canvas.setAttribute('aria-label', ariaLabel)

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, revenue, totalExpenses, netProfit])

  return (
    <div className="reports-waterfall-canvas">
      <canvas ref={canvasRef} role="img" aria-label="Profit and loss waterfall chart">
        Waterfall chart showing revenue, expenses, and net profit
      </canvas>
    </div>
  )
}
