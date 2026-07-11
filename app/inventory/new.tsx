import { Redirect, useLocalSearchParams } from 'expo-router'

/** Legacy route — forwards to category-aware supply editor. */
export default function LegacyNewSupplyScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>()
  const resolvedKind = kind === 'chemical' ? 'chemical' : 'consumable'
  return <Redirect href={`/inventory/supply/new?kind=${resolvedKind}`} />
}
