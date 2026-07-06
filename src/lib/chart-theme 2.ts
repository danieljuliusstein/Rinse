/** Read operator theme tokens for Chart.js (light/dark aware). */
export function readChartTheme() {
  if (typeof document === 'undefined') {
    return {
      tooltipBg: '#ffffff',
      tooltipTitle: '#8e8e93',
      tooltipBody: '#000000',
      tooltipBorder: '#e5e5ea',
      tick: '#8e8e93',
      grid: '#e5e5ea',
      connector: '#c7c7cc',
    }
  }

  const style = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback

  return {
    tooltipBg: token('--bg-elevated', '#ffffff'),
    tooltipTitle: token('--text-muted', '#8e8e93'),
    tooltipBody: token('--text-primary', '#000000'),
    tooltipBorder: token('--border', '#e5e5ea'),
    tick: token('--text-muted', '#8e8e93'),
    grid: token('--border', '#e5e5ea'),
    connector: token('--border-strong', '#c7c7cc'),
  }
}
