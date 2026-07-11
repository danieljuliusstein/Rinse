import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DotsThreeVertical } from 'phosphor-react-native'
import type { LeadStage, LeadWithRelations } from '@rinse/core'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { CurrencyAmount } from '@/src/components/ui/CurrencyAmount'
import { InteractiveView } from '@/src/components/ui/InteractiveView'
import { ListRow } from '@/src/components/ui/ListRow'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { createQuoteForLead, deleteLead, updateLeadStage } from '@/src/lib/leads-api'
import { LEAD_STAGES, leadSourceBadgeTone, leadSourceLabel, resolveLeadStage } from '@/src/lib/lead-sources'
import { colors, spacing } from '@/src/theme/colors'

interface PipelineLeadRowProps {
  lead: LeadWithRelations
  onRefresh: () => void
  isLast?: boolean
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function serviceLabel(lead: LeadWithRelations): string {
  if (lead.package?.name) return lead.package.name
  if (lead.service_interest) return lead.service_interest
  return 'Service TBD'
}

function leadSubtitle(lead: LeadWithRelations): string {
  const parts = [
    serviceLabel(lead),
    lead.vehicle_type ? capitalize(lead.vehicle_type) : null,
    lead.phone,
  ].filter(Boolean)
  return parts.join(' · ')
}

export function PipelineLeadRow({ lead, onRefresh, isLast = false }: PipelineLeadRowProps) {
  const router = useRouter()
  const { openQuote, openJob } = useDetailNavigation()
  const [loading, setLoading] = useState(false)
  const stage = resolveLeadStage(lead)
  const isScheduled = stage === 'booked' || Boolean(lead.job_id)

  const handleQuote = async () => {
    if (lead.quote_id) {
      openQuote(lead.quote_id, onRefresh)
      return
    }
    setLoading(true)
    try {
      const quote = await createQuoteForLead(lead.id)
      onRefresh()
      openQuote(quote.id, onRefresh)
    } catch (e) {
      Alert.alert('Quote', e instanceof Error ? e.message : 'Could not create quote')
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = () => {
    if (isScheduled && lead.job_id) {
      openJob(lead.job_id)
      return
    }
    router.push(`/pipeline/${lead.id}` as never)
  }

  const handleMove = async (stage: LeadStage) => {
    setLoading(true)
    try {
      await updateLeadStage(lead.id, stage)
      onRefresh()
    } catch (e) {
      Alert.alert('Pipeline', e instanceof Error ? e.message : 'Could not move lead')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Remove lead?', `Remove ${lead.name} from the pipeline?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove lead',
        style: 'destructive',
        onPress: () => {
          setLoading(true)
          void deleteLead(lead.id).then((ok) => {
            if (ok) onRefresh()
            else Alert.alert('Remove', 'Could not remove lead')
            setLoading(false)
          })
        },
      },
    ])
  }

  const showMenu = () => {
    const otherStages = LEAD_STAGES.filter((s) => s.id !== stage)
    Alert.alert(lead.name, undefined, [
      ...otherStages.map((s) => ({
        text: `Move to ${s.label}`,
        onPress: () => void handleMove(s.id),
      })),
      { text: 'Edit lead', onPress: () => router.push(`/pipeline/${lead.id}` as never) },
      { text: 'Remove lead', style: 'destructive' as const, onPress: handleDelete },
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  const quoteSubtitle = lead.quote?.quote_number
    ? `${lead.quote.quote_number} · ${lead.quote.status}`
    : undefined

  const showQuoteCta =
    stage === 'inquiry' || (stage === 'quoted' && Boolean(lead.quote_id) && !isScheduled)
  const showScheduleCta = stage === 'quoted' || stage === 'booked' || isScheduled

  const quoteLabel = loading ? 'Creating quote…' : lead.quote_id ? 'Open quote' : 'Send quote'
  const scheduleLabel = loading ? 'Scheduling…' : isScheduled ? 'Scheduled' : 'Schedule job'
  const bothActions = showQuoteCta && showScheduleCta

  return (
    <View style={[styles.item, isLast ? styles.itemLast : null, loading ? styles.itemBusy : null]}>
      <ListRow
        grouped
        isLast
        alignTop
        nestedInteractions
        title={lead.name}
        subtitle={leadSubtitle(lead)}
        badges={
          <View
            style={styles.badgeRow}
            children={[
              <Badge
                key="source"
                tone={leadSourceBadgeTone(lead.source)}
                label={leadSourceLabel(lead.source)}
              />,
              isScheduled ? <Badge key="scheduled" tone="green" label="Scheduled" /> : null,
              quoteSubtitle && lead.quote_id ? (
                <InteractiveView
                  key="quote"
                  onPress={() => openQuote(lead.quote_id!, onRefresh)}
                  accessibilityLabel={`View quote ${quoteSubtitle}`}
                >
                  <Badge tone="gray" label={quoteSubtitle} />
                </InteractiveView>
              ) : null,
            ]}
          />
        }
        trailing={
          <View style={styles.trailing}>
            {lead.quote_amount ? (
              <CurrencyAmount value={lead.quote_amount} variant="revenue" />
            ) : null}
            <InteractiveView
              onPress={showMenu}
              accessibilityLabel={`Actions for ${lead.name}`}
              style={styles.menuBtn}
            >
              <DotsThreeVertical size={18} color={colors.textMuted} weight="bold" />
            </InteractiveView>
          </View>
        }
        showChevron={false}
        onPress={() => router.push(`/pipeline/${lead.id}` as never)}
      />

      {showQuoteCta || showScheduleCta ? (
        <View style={[styles.actions, bothActions ? styles.actionsRow : null]}>
          {showQuoteCta ? (
            <Button
              variant="secondary"
              label={quoteLabel}
              onPress={() => void handleQuote()}
              loading={loading}
              style={[styles.actionBtn, bothActions ? styles.actionBtnHalf : null]}
            />
          ) : null}
          {showScheduleCta ? (
            <Button
              variant={isScheduled ? 'ghost' : 'secondary'}
              label={scheduleLabel}
              onPress={handleSchedule}
              loading={loading}
              style={[styles.actionBtn, bothActions ? styles.actionBtnHalf : null]}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

PipelineLeadRow.displayName = 'PipelineLeadRow'

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemBusy: {
    opacity: 0.7,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  amount: {
    color: colors.greenText,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  actions: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 10,
    minHeight: 40,
  },
  actionBtnHalf: {
    flex: 1,
    width: undefined,
  },
})
