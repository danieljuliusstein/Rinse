/** Truncate long strings in the middle for monospace URL display. */
export function truncateMiddle(value: string, head = 22, tail = 14): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}
