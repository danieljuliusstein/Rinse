import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CalendarBlank, FileText } from 'phosphor-react-native'
import type { JobWithRelations, LeadStage, LeadWithRelations } from '@rinse/core'
import { SubScreen } from '@/src/components/SubScreen'
import {
  AppText,
  Badge,
  CurrencyAmount,
  ListRow,
  PillGroup,
  PrimaryButton,
  SecondaryButton,
  SectionGroup,
} from '@/src/components/ui'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { formatJobDate } from '@/src/lib/format-dates'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { LEAD_STAGES, leadSourceLabel, leadStageLabel } from '@/src/lib/lead-sources'
import {
  convertLeadToJob,
  createQuoteForLead,
  deleteLead,
  getLead,
  updateLeadStage,
} from '@/src/lib/leads-api'
import { getJob } from '@/src/lib/api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

function serviceLabel(lead: LeadWithRelations): string {
  if (lead.package?.name) return lead.package.name
  if (lead.service_interest) return lead.service_interest
  return 'Service TBD'
}

function leadSubtitle(lead: LeadWithRelations): string {
  return [serviceLabel(lead), lead.phone, lead.email].filter(Boolean).join(' · ')
}

export default function PipelineLeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { openJob, openQuote } = useDetailNavigation()
  const [lead, setLead] = useState<LeadWithRelations | null>(null)
  const [scheduledJob, setScheduledJob] = useState<JobWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const row = await getLead(id)
    setLead(row)
    if (row?.job_id) {
      setScheduledJob(await getJob(row.job_id))
    } else {
      setScheduledJob(null)
    }
  }, [id])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
      await load()
    } catch (e) {
      Alert.alert(label, e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <SubScreen title="Lead" tabDock={false}>
        <AppText variant="body" style={styles.muted}>
          Loading…
        </AppText>
      </SubScreen>
    )
  }

  if (!lead) {
    return (
      <SubScreen title="Lead" tabDock={false}>
        <AppText variant="body" style={styles.muted}>
          Lead not found.
        </AppText>
      </SubScreen>
    )
  }

  const isScheduled = Boolean(lead.job_id)
  const showQuoteCta =
    lead.stage === 'inquiry' || (lead.stage === 'quoted' && Boolean(lead.quote_id) && !isScheduled)
  const showScheduleCta = lead.stage === 'quoted' || lead.stage === 'booked' || isScheduled

  const moveStage = (stage: LeadStage) => {
    if (stage === lead.stage) return
    void run('Move lead', async () => {
      await updateLeadStage(lead.id, stage)
    })
  }

  const handleQuote = () => {
    if (lead.quote_id) {
      openQuote(lead.quote_id, () => void load())
      return
    }
    if (!lead.package_id) {
      Alert.alert('Package required', 'Edit this lead and pick a service package first.', [
        { text: 'Edit lead', onPress: () => router.push(`/leads/new?leadId=${lead.id}` as never) },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }
    void run('Create quote', async () => {
      const gate = await checkPremiumGate('create_quote')
      if (!gate.allowed) return
      const quote = await createQuoteForLead(lead.id)
      openQuote(quote.id, () => void load())
    })
  }

  const handleSchedule = () => {
    if (isScheduled && lead.job_id) {
      openJob(lead.job_id)
      return
    }
    void run('Schedule job', async () => {
      const gate = await checkPremiumGate('create_job')
      if (!gate.allowed) return
      const { jobId } = await convertLeadToJob(lead.id)
      openJob(jobId)
    })
  }

  const handleDelete = () => {
    Alert.alert('Remove lead?', `Remove ${lead.name} from the pipeline?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void run('Remove lead', async () => {
            const ok = await deleteLead(lead.id)
            if (!ok) throw new Error('Could not remove lead')
            router.back()
          })
        },
      },
    ])
  }

  const quoteSubtitle = lead.quote?.quote_number
    ? `${lead.quote.quote_number} · ${lead.quote.status}`
    : undefined

  return (
    <SubScreen title={lead.name} subtitle={leadStageLabel(lead.stage)} tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.badges}>
          <Badge tone="blue" label={leadSourceLabel(lead.source)} />
          <Badge tone="gray" label={leadStageLabel(lead.stage)} />
          {isScheduled ? <Badge tone="green" label="Scheduled" /> : null}
          {quoteSubtitle ? <Badge tone="gray" label={quoteSubtitle} /> : null}
        </View>

        <AppText variant="body" style={styles.muted}>
          {leadSubtitle(lead)}
        </AppText>

        {lead.quote_amount ? (
          <CurrencyAmount value={lead.quote_amount} variant="revenue" size="stat" style={styles.amount} />
        ) : null}

        {isScheduled && scheduledJob ? (
          <SectionGroup title="Scheduled job">
            <ListRow
              grouped
              icon={<CalendarBlank size={18} color={iconTonePalette.green.fg} weight="duotone" />}
              iconTone="green"
              title={formatJobDate(scheduledJob.date)}
              subtitle={[
                scheduledJob.package?.name ?? 'Detail',
                formatStartTimeLabel(scheduledJob.start_time),
              ]
                .filter(Boolean)
                .join(' · ')}
              badgeLabel="Scheduled"
              badgeTone="green"
              onPress={() => openJob(scheduledJob.id)}
            />
          </SectionGroup>
        ) : null}

        {lead.quote_id ? (
          <SectionGroup title="Quote">
            <ListRow
              grouped
              icon={<FileText size={18} color={iconTonePalette.blue.fg} weight="duotone" />}
              iconTone="blue"
              title={lead.quote?.quote_number ?? 'Quote'}
              subtitle={lead.quote?.date ? formatJobDate(lead.quote.date) : undefined}
              trailing={
                lead.quote_amount ? (
                  <CurrencyAmount value={lead.quote_amount} variant="revenue" />
                ) : undefined
              }
              onPress={() => openQuote(lead.quote_id!, () => void load())}
            />
          </SectionGroup>
        ) : null}

        {lead.notes ? (
          <SectionGroup title="Notes" grouped={false}>
            <AppText variant="body">{lead.notes}</AppText>
          </SectionGroup>
        ) : null}

        <SectionGroup title="Stage" grouped={false}>
          <PillGroup
            options={LEAD_STAGES.map((s) => ({ value: s.id, label: s.label }))}
            value={lead.stage}
            onChange={(stage) => moveStage(stage)}
          />
        </SectionGroup>

        <View style={styles.actions}>
          {showQuoteCta ? (
            <PrimaryButton
              label={lead.quote_id ? 'Open quote' : busy ? 'Creating quote…' : 'Send quote'}
              loading={busy}
              onPress={handleQuote}
            />
          ) : null}

          {showScheduleCta ? (
            <SecondaryButton
              label={isScheduled ? 'View scheduled job' : busy ? 'Scheduling…' : 'Schedule job'}
              loading={busy}
              onPress={handleSchedule}
            />
          ) : null}

          {lead.client_id ? (
            <SecondaryButton
              label="View client"
              onPress={() => router.push(`/(tabs)/clients/${lead.client_id}` as never)}
            />
          ) : null}

          <SecondaryButton
            label="Edit lead"
            onPress={() => router.push(`/leads/new?leadId=${lead.id}` as never)}
          />

          <SecondaryButton label="Remove lead" onPress={handleDelete} />
        </View>
      </ScrollView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  muted: {
    color: colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amount: {
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
})
