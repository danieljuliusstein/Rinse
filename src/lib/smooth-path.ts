type Point = { x: number; y: number }

/**
 * Convert points into a smooth SVG path using Catmull-Rom → cubic Bezier.
 */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const tension = 0.5
  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

/** Smooth line path closed to baseline for area fill. */
export function smoothAreaPath(points: Point[], width: number, height: number): string {
  const line = smoothPath(points)
  if (!line) return ''
  return `${line} L ${width} ${height} L 0 ${height} Z`
}
