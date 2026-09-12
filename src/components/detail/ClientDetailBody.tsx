import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Car,
  ChatText,
  Envelope,
  FileText,
  MapPin,
  Phone,
  Receipt,
  Trash,
  Users,
} from '@/src/icons'
import { fmt, mapJobStatusForDisplay } from '@rinse/core'
import type { Client, JobWithRelations, QuoteWithRelations, Vehicle } from '@rinse/core'
import { composeSmsFromTemplate } from '@/src/lib/messages-api'
import {
  deleteClient,
  getClient,
  getClientJobs,
  listChildClients,
  openMaps,
  openPhone,
  openSms,
  updateClient,
} from '@/src/lib/api'
import { PillGroup } from '@/src/components/ui'
import { listVehiclesForClient, vehicleDisplayName } from '@/src/lib/damage-api'
import { getQuotesForClient } from '@/src/lib/quotes-api'
import { checkRecordConflict, refreshRecordFromServer } from '@/src/lib/conflict'
import { formatJobDate } from '@/src/lib/format-dates'
import { jobListBadgeTone, jobListIconTone, jobListStatusKey } from '@/src/lib/jobs-list'
import {
  clientDetailPriority,
  type ClientDetailSection,
} from '@/src/lib/client-detail-priority'
import { VehicleTypeIcon } from '@/src/lib/vehicle-type-icons'
import { requireOrganizationId } from '@/src/lib/org'
import { ConflictBanner } from '@/src/components/ConflictBanner'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import { CurrencyAmount } from '@/src/components/ui/CurrencyAmount'
import { ListRow } from '@/src/components/ui/ListRow'
import { AccordionSection } from '@/src/components/ui/AccordionSection'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { DetailRow } from '@/src/components/ui/DetailRow'
import { TextActionRow } from '@/src/components/ui/TextActionRow'
import { navigateAfterClose } from '@/src/lib/navigate-after-close'
import { JobStatusPanel } from '@/src/components/detail/JobStatusPanel'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui/Button'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import { noScrollbarScrollProps } from '@/src/theme/invoice-surface'
import { colors, iconTonePalette, radii, shadows, spacing } from '@/src/theme/colors'

interface ClientDetailBodyProps {
  clientId: string
  onClose?: () => void
  onMetaChange?: (meta: { title: string; subtitle?: string }) => void
  variant?: 'screen' | 'overlay'
}

function quoteBadgeTone(status: string): 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  if (status === 'accepted') return 'green'
  if (status === 'declined' || status === 'expired') return 'red'
  if (status === 'sent') return 'blue'
  return 'gray'
}

export function ClientDetailBody({
  clientId,
  onClose,
  onMetaChange,
  variant = 'screen',
}: ClientDetailBodyProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const dockPadding = useTabDockPadding(variant === 'screen')
  const { openJob, openQuote } = useDetailNavigation()
  const [client, setClient] = useState<Client | null>(null)
  const [parentClient, setParentClient] = useState<Client | null>(null)
  const [childClients, setChildClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasConflict, setHasConflict] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<ClientDetailSection | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const row = await getClient(clientId)
    setClient(row)
    const [vehicleRows, jobRows, quoteRows, children] = await Promise.all([
      listVehiclesForClient(clientId),
      getClientJobs(clientId),
      getQuotesForClient(clientId),
      listChildClients(clientId),
    ])
    setVehicles(vehicleRows)
    setJobs(jobRows)
    setQuotes(quoteRows)
    setChildClients(children)
    if (row?.parent_client_id) {
      const parent = await getClient(row.parent_client_id)
      setParentClient(parent)
    } else {
      setParentClient(null)
    }
    const conflict = await checkRecordConflict('clients', clientId)
    setHasConflict(conflict.hasConflict)
    return { row, vehicleRows, jobRows }
  }, [clientId])

  useEffect(() => {
    let cancelled = false
    void load()
      .then((result) => {
        if (cancelled || !result?.row) return
        const priority = clientDetailPriority(result.row, result.jobRows, result.vehicleRows.length)
        setOpenSection(priority.defaultSection)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load client')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const handleRefreshFromServer = async () => {
    setRefreshing(true)
    try {
      const orgId = requireOrganizationId()
      await refreshRecordFromServer('clients', clientId, orgId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleTextClient = useCallback(async () => {
    if (!client?.phone) return
    const recent = jobs.find((j) => j.status === 'scheduled') ?? jobs[0]
    const body = await composeSmsFromTemplate('follow_up', {
      name: client.name,
      packageName: recent?.package?.name,
    })
    const url = openSms(client.phone, body)
    try {
      const can = await Linking.canOpenURL(url)
      if (!can) {
        Alert.alert('Text', 'Messaging is not available on this device.')
        return
      }
      await Linking.openURL(url)
    } catch {
      Alert.alert('Text', 'Could not open Messages.')
    }
  }, [client, jobs])

  const handleCallClient = useCallback(async () => {
    if (!client?.phone) return
    const url = openPhone(client.phone)
    try {
      const can = await Linking.canOpenURL(url)
      if (!can) {
        Alert.alert('Call', 'Calling is not available on this device.')
        return
      }
      await Linking.openURL(url)
    } catch {
      Alert.alert('Call', 'Could not open Phone.')
    }
  }, [client])

  const priority = useMemo(
    () => (client ? clientDetailPriority(client, jobs, vehicles.length) : null),
    [client, jobs, vehicles.length],
  )

  useEffect(() => {
    if (!client || !onMetaChange) return
    const subtitle = [
      client.phone,
      jobs.length > 0 ? `${jobs.length} job${jobs.length === 1 ? '' : 's'}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    onMetaChange({ title: client.name, subtitle: subtitle || undefined })
  }, [client, jobs.length, onMetaChange])

  if (loading) return <LoadingState label="Loading client…" />

  if (error || !client || !priority) {
    return (
      <View style={styles.errorWrap}>
        <AppText variant="body" style={styles.error}>
          {error ?? 'Client not found'}
        </AppText>
      </View>
    )
  }

  const totalRevenue = jobs.reduce((s, j) => s + j.revenue + j.tip, 0)
  const avgJob = jobs.length > 0 ? totalRevenue / jobs.length : 0
  const upcomingJobs = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress')
  const pastJobs = jobs.filter(
    (j) => j.status !== 'scheduled' && j.status !== 'in_progress' && j.status !== 'cancelled',
  )
  const billableJobs = jobs.filter(
    (j) => (j.status === 'completed' || j.status === 'paid') && !j.invoice_id,
  )
  const recentQuotes = quotes.slice(0, 3)
  const contentPadding = variant === 'overlay' ? spacing.md : 0
  const bottomPad = variant === 'screen' ? dockPadding : spacing.xl
  const avatarPalette = priority.isVip ? iconTonePalette.green : iconTonePalette.purple

  const navigateAway = (href: string) => {
    navigateAfterClose(onClose, () => router.push(href as never))
  }

  const toggleSection = (section: ClientDetailSection) => {
    setOpenSection((current) => (current === section ? null : section))
  }

  const handleRemove = () => {
    const parts = [
      jobs.length > 0 ? `${jobs.length} job${jobs.length === 1 ? '' : 's'}` : null,
      vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    const detail = parts.length > 0 ? ` This will permanently delete ${parts.join(' and ')}.` : ''

    Alert.alert(
      'Remove client?',
      `Remove ${client.name} from your client list?${detail} This cannot be undone.`,
      [
        { text: 'Keep client', style: 'cancel' },
        {
          text: 'Remove client',
          style: 'destructive',
          onPress: () => {
            setRemoving(true)
            void deleteClient(clientId).then((result) => {
              if (result.ok) {
                onClose?.()
                if (variant === 'screen') router.replace('/(tabs)/clients')
              } else {
                setRemoving(false)
                Alert.alert('Remove client', result.error ?? 'Could not remove client')
              }
            })
          },
        },
      ],
    )
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingHorizontal: contentPadding, paddingBottom: bottomPad },
      ]}
      {...noScrollbarScrollProps}
    >
      <View style={styles.identityRow}>
        <View style={[styles.avatar, { backgroundColor: avatarPalette.bg }]}>
          <AppText variant="bodySemiBold" style={[styles.avatarText, { color: avatarPalette.fg }]}>
            {priority.initials}
          </AppText>
        </View>
        <View style={styles.identityCopy}>
          <AppText variant="h1" style={styles.identityName}>
            {client.name}
          </AppText>
          <View style={styles.tagRow}>
            {priority.isVip ? <Badge tone="green" label="VIP" /> : null}
            {client.membership_paused ? <Badge tone="amber" label="Paused" /> : null}
            {client.lead_source ? (
              <Badge tone="gray" label={client.lead_source.replace(/_/g, ' ')} />
            ) : null}
          </View>
        </View>
      </View>

      {hasConflict ? (
        <ConflictBanner onRefresh={() => void handleRefreshFromServer()} refreshing={refreshing} />
      ) : null}

      <JobStatusPanel
        eyebrow={priority.eyebrow}
        heading={priority.heading}
        statusTone={priority.statusTone}
      />

      {(client.phone || client.email || client.address) ? (
        <View style={styles.card}>
          {client.phone ? (
            <TextActionRow
              label={client.phone}
              icon={<Phone size={18} color={colors.greenText} weight="duotone" />}
              onPress={() => void handleCallClient()}
            />
          ) : null}
          {client.phone ? (
            <TextActionRow
              label={t('clientDetail.text')}
              icon={<ChatText size={18} color={colors.greenText} weight="duotone" />}
              onPress={() => void handleTextClient()}
            />
          ) : null}
          {client.email ? (
            <TextActionRow
              label={client.email}
              icon={<Envelope size={18} color={colors.greenText} weight="duotone" />}
              onPress={() => void Linking.openURL(`mailto:${client.email}`)}
            />
          ) : null}
          {client.address ? (
            <TextActionRow
              label={client.address}
              icon={<MapPin size={18} color={colors.greenText} weight="duotone" />}
              onPress={() => void Linking.openURL(openMaps(client.address!))}
            />
          ) : null}
        </View>
      ) : null}

      <PrimaryButton
        label={t('clientDetail.newJob')}
        onPress={() => navigateAway(`/jobs/new?clientId=${clientId}`)}
      />

      <View style={styles.card}>
        <TextActionRow
          label={t('clientDetail.quote')}
          icon={<FileText size={18} color={colors.greenText} weight="duotone" />}
          onPress={() => navigateAway(`/quotes/new?clientId=${clientId}`)}
        />
        <TextActionRow
          label={t('clientDetail.invoice')}
          icon={<Receipt size={18} color={colors.greenText} weight="duotone" />}
          disabled={billableJobs.length === 0}
          onPress={() => {
            if (billableJobs.length === 1) {
              navigateAway(`/jobs/${billableJobs[0]!.id}/invoice`)
            } else {
              navigateAway('/invoices/new')
            }
          }}
        />
        <TextActionRow
          label={t('clientDetail.editClient')}
          onPress={() => navigateAway(`/clients/edit/${clientId}`)}
        />
      </View>

      <View style={styles.card}>
        <DetailRow label={t('clientDetail.totalRevenue')} value={fmt(totalRevenue)} />
        <DetailRow label={t('clientDetail.totalJobs')} value={String(jobs.length)} />
        <DetailRow label={t('clientDetail.avgJob')} value={fmt(avgJob)} />
        <DetailRow
          label={t('clientDetail.leadSource')}
          value={client.lead_source?.replace(/_/g, ' ') ?? '—'}
          isLast
        />
      </View>

      {client.notes ? (
        <AccordionSection
          title={t('clientDetail.notes')}
          hint={client.notes.slice(0, 48) + (client.notes.length > 48 ? '…' : '')}
          icon={<FileText size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'notes'}
          onToggle={() => toggleSection('notes')}
        >
          <AppText variant="body">{client.notes}</AppText>
        </AccordionSection>
      ) : null}

      <AccordionSection
        title="Membership"
        hint={
          client.membership_paused
            ? 'Paused'
            : client.membership_next_visit
              ? `Next · ${client.membership_next_visit}`
              : 'Cadence & visits'
        }
        icon={<Users size={19} color={colors.greenText} weight="duotone" />}
        expanded={openSection === 'membership'}
        onToggle={() => toggleSection('membership')}
      >
        <PillGroup
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Biweekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          value={client.membership_cadence ?? 'monthly'}
          onChange={(membership_cadence) => {
            void updateClient(clientId, { name: client.name, membership_cadence }).then(setClient)
          }}
        />
        <AppText variant="caption" style={styles.muted}>
          Next visit: {client.membership_next_visit || '—'}
        </AppText>
        <SecondaryButton
          label={client.membership_paused ? 'Resume membership' : 'Pause membership'}
          onPress={() => {
            void updateClient(clientId, {
              name: client.name,
              membership_paused: !client.membership_paused,
            }).then(setClient)
          }}
        />
      </AccordionSection>

      <SectionGroup
        title={t('clientDetail.vehicles')}
        meta={
          vehicles.length > 0
            ? `${vehicles.length} on file`
            : t('clientDetail.addVehicle')
        }
        inset={vehicles.length === 0}
      >
        {vehicles.length === 0 ? (
          <>
            <AppText variant="caption" style={styles.muted}>
              Document pre-existing damage on each vehicle.
            </AppText>
            <Pressable onPress={() => navigateAway(`/clients/${clientId}/vehicles/new`)}>
              <AppText variant="caption" style={styles.link}>
                + Add vehicle
              </AppText>
            </Pressable>
          </>
        ) : (
          vehicles.map((vehicle) => (
            <ListRow
              key={vehicle.id}
              title={vehicleDisplayName(vehicle)}
              subtitle={vehicle.plate ?? vehicle.color ?? 'View damage docs'}
              icon={<VehicleTypeIcon type={vehicle.type} size={18} color={iconTonePalette.blue.fg} />}
              iconTone="blue"
              onPress={() => navigateAway(`/(tabs)/clients/${clientId}/vehicles/${vehicle.id}`)}
            />
          ))
        )}
      </SectionGroup>
      {vehicles.length > 0 ? (
        <Pressable
          onPress={() => navigateAway(`/clients/${clientId}/vehicles/new`)}
          style={styles.addVehicleLink}
        >
          <AppText variant="caption" style={styles.link}>
            + Add vehicle
          </AppText>
        </Pressable>
      ) : null}

      {recentQuotes.length > 0 ? (
        <AccordionSection
          title={t('clientDetail.quotes')}
          hint={`${quotes.length} total`}
          icon={<FileText size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'quotes'}
          onToggle={() => toggleSection('quotes')}
        >
          {recentQuotes.map((quote) => (
            <ListRow
              key={quote.id}
              icon={<FileText size={18} color={iconTonePalette.blue.fg} weight="duotone" />}
              iconTone="blue"
              title={quote.quote_number || 'Quote'}
              subtitle={quote.package?.name ?? quote.status}
              badgeLabel={quote.status}
              badgeTone={quoteBadgeTone(quote.status)}
              trailing={<CurrencyAmount value={quote.subtotal} variant="neutral" />}
              onPress={() => openQuote(quote.id, () => void load())}
            />
          ))}
          <Pressable onPress={() => navigateAway(`/quotes?client=${clientId}`)}>
            <AppText variant="caption" style={styles.link}>
              View all quotes
            </AppText>
          </Pressable>
        </AccordionSection>
      ) : null}

      {(parentClient || childClients.length > 0) ? (
        <AccordionSection
          title="Accounts"
          hint={parentClient ? 'Sub-customer' : `${childClients.length} linked`}
          icon={<Users size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'family'}
          onToggle={() => toggleSection('family')}
        >
          {parentClient ? (
            <ListRow
              title={parentClient.name}
              subtitle="Parent account"
              icon={<Users size={18} color={iconTonePalette.purple.fg} weight="duotone" />}
              iconTone="purple"
              onPress={() => navigateAway(`/(tabs)/clients/${parentClient.id}`)}
            />
          ) : null}
          {!client.parent_client_id ? (
            <>
              <Pressable onPress={() => navigateAway(`/clients/new?parent=${clientId}`)}>
                <AppText variant="caption" style={styles.link}>
                  + Add sub-customer
                </AppText>
              </Pressable>
              {childClients.map((child) => (
                <ListRow
                  key={child.id}
                  title={child.name}
                  subtitle={child.phone ?? child.email ?? 'Sub-customer'}
                  icon={<Users size={18} color={iconTonePalette.purple.fg} weight="duotone" />}
                  iconTone="purple"
                  onPress={() => navigateAway(`/(tabs)/clients/${child.id}`)}
                />
              ))}
            </>
          ) : null}
        </AccordionSection>
      ) : null}

      {upcomingJobs.length > 0 ? (
        <AccordionSection
          title={t('clientDetail.upcoming')}
          hint={`${upcomingJobs.length} scheduled`}
          icon={<Car size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'upcoming'}
          onToggle={() => toggleSection('upcoming')}
        >
          {upcomingJobs.map((job) => (
            <ListRow
              key={job.id}
              icon={<Car size={18} color={iconTonePalette.amber.fg} weight="duotone" />}
              iconTone={jobListIconTone(job)}
              title={job.package?.name ?? t('jobDetail.titleFallback')}
              subtitle={formatJobDate(job.date)}
              badgeLabel={t(`jobs.status.${jobListStatusKey(job)}`)}
              badgeTone={jobListBadgeTone(job)}
              trailing={
                <AppText variant="bodySemiBold" style={styles.amount}>
                  {fmt(job.revenue + job.tip)}
                </AppText>
              }
              onPress={() => openJob(job.id)}
            />
          ))}
        </AccordionSection>
      ) : null}

      {pastJobs.length > 0 ? (
        <AccordionSection
          title={t('clientDetail.jobHistory')}
          hint={`${pastJobs.length} completed`}
          icon={<Receipt size={19} color={colors.greenText} weight="duotone" />}
          expanded={openSection === 'history'}
          onToggle={() => toggleSection('history')}
        >
          {pastJobs.slice(0, 8).map((job, index) => (
            <ListRow
              key={job.id}
              grouped={index < Math.min(pastJobs.length, 8) - 1}
              icon={<Car size={18} color={iconTonePalette.green.fg} weight="duotone" />}
              iconTone={jobListIconTone(job)}
              title={job.package?.name ?? t('jobDetail.titleFallback')}
              subtitle={formatJobDate(job.date)}
              badgeLabel={mapJobStatusForDisplay(job)}
              badgeTone={jobListBadgeTone(job)}
              trailing={<AppText variant="bodySemiBold">{fmt(job.revenue + job.tip)}</AppText>}
              onPress={() => openJob(job.id)}
            />
          ))}
        </AccordionSection>
      ) : null}

      <Pressable
        style={[styles.removeBtn, removing && styles.disabled]}
        onPress={handleRemove}
        disabled={removing}
      >
        <Trash size={18} color={colors.danger} />
        <AppText variant="bodySemiBold" style={styles.removeLabel}>
          {removing ? 'Removing…' : 'Remove client'}
        </AppText>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  identityName: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muted: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  link: {
    color: colors.greenText,
    fontWeight: '600',
  },
  addVehicleLink: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  amount: {
    color: colors.greenText,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.sheet,
    backgroundColor: '#fef2f2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    marginTop: spacing.sm,
  },
  removeLabel: {
    color: colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  errorWrap: {
    padding: spacing.md,
  },
  error: {
    color: colors.danger,
  },
})
