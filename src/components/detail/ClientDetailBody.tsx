import { useCallback, useEffect, useState } from 'react'
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
  Plus,
  Receipt,
  Trash,
  Users,
} from 'phosphor-react-native'
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
import { VehicleTypeIcon } from '@/src/lib/vehicle-type-icons'
import { requireOrganizationId } from '@/src/lib/org'
import { ConflictBanner } from '@/src/components/ConflictBanner'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import { CurrencyAmount } from '@/src/components/ui/CurrencyAmount'
import { ListRow } from '@/src/components/ui/ListRow'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui/Button'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

interface ClientDetailBodyProps {
  clientId: string
  onClose?: () => void
  variant?: 'screen' | 'overlay'
}

function quoteBadgeTone(status: string): 'green' | 'blue' | 'amber' | 'red' | 'gray' {
  if (status === 'accepted') return 'green'
  if (status === 'declined' || status === 'expired') return 'red'
  if (status === 'sent') return 'blue'
  return 'gray'
}

export function ClientDetailBody({ clientId, onClose, variant = 'screen' }: ClientDetailBodyProps) {
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
  }, [clientId])

  useEffect(() => {
    let cancelled = false
    void load()
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

  if (loading) return <LoadingState label="Loading client…" />

  if (error || !client) {
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
    (j) =>
      j.status !== 'scheduled' &&
      j.status !== 'in_progress' &&
      j.status !== 'cancelled',
  )
  const billableJobs = jobs.filter(
    (j) => (j.status === 'completed' || j.status === 'paid') && !j.invoice_id,
  )
  const recentQuotes = quotes.slice(0, 3)
  const contentPadding = variant === 'overlay' ? spacing.md : 0
  const bottomPad = variant === 'screen' ? dockPadding : spacing.xl

  const navigateAway = (href: string) => {
    onClose?.()
    router.push(href as never)
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
    >
      {variant === 'overlay' ? (
        <View style={styles.overlayHeader}>
          <AppText variant="h1">{client.name}</AppText>
          {client.phone ? <AppText variant="body">{client.phone}</AppText> : null}
          {client.email ? <AppText variant="caption" style={styles.muted}>{client.email}</AppText> : null}
          {client.address ? (
            <AppText variant="caption" style={styles.muted}>{client.address}</AppText>
          ) : null}
          {client.address ? (
            <Pressable
              style={styles.directionsBtn}
              onPress={() => void Linking.openURL(openMaps(client.address!))}
            >
              <MapPin size={14} color={colors.greenText} weight="bold" />
              <AppText variant="bodySemiBold" style={styles.directionsLabel}>
                {t('clientDetail.directions')}
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.editLink}
            onPress={() => navigateAway(`/clients/edit/${clientId}`)}
          >
            <AppText variant="caption" style={styles.editLabel}>
              {t('clientDetail.editClient')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {hasConflict ? (
        <ConflictBanner onRefresh={() => void handleRefreshFromServer()} refreshing={refreshing} />
      ) : null}

      {(client.phone || client.email) && variant === 'overlay' ? (
        <View style={styles.actionGrid}>
          {client.phone ? (
            <Pressable
              style={styles.actionCell}
              onPress={() => void handleCallClient()}
            >
              <Phone size={20} color={colors.textMuted} />
              <AppText variant="caption">{t('clientDetail.call')}</AppText>
            </Pressable>
          ) : null}
          {client.phone ? (
            <Pressable
              style={styles.actionCell}
              onPress={() => void handleTextClient()}
            >
              <ChatText size={20} color={colors.textMuted} />
              <AppText variant="caption">{t('clientDetail.text')}</AppText>
            </Pressable>
          ) : null}
          {client.email ? (
            <Pressable
              style={styles.actionCell}
              onPress={() => void Linking.openURL(`mailto:${client.email}`)}
            >
              <Envelope size={20} color={colors.textMuted} />
              <AppText variant="caption">{t('clientDetail.email')}</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.ctaRow}>
        <SecondaryButton label={t('clientDetail.newJob')} onPress={() => navigateAway(`/jobs/new?clientId=${clientId}`)} />
        <SecondaryButton label={t('clientDetail.quote')} onPress={() => navigateAway(`/quotes/new?clientId=${clientId}`)} />
        <SecondaryButton
          label={t('clientDetail.invoice')}
          disabled={billableJobs.length === 0}
          onPress={() => {
            if (billableJobs.length === 1) {
              navigateAway(`/jobs/${billableJobs[0].id}/invoice`)
            } else {
              navigateAway('/invoices/new')
            }
          }}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.statsGrid}>
          <StatCell label={t('clientDetail.totalRevenue')} value={fmt(totalRevenue)} />
          <StatCell label={t('clientDetail.totalJobs')} value={String(jobs.length)} />
          <StatCell label={t('clientDetail.avgJob')} value={fmt(avgJob)} />
          <StatCell
            label={t('clientDetail.leadSource')}
            value={client.lead_source?.replace(/_/g, ' ') ?? '—'}
            cap
          />
        </View>
      </View>

      {client.notes ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('clientDetail.notes')}</AppText>
          <View style={styles.card}>
            <AppText variant="body">{client.notes}</AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="sectionLabel">Membership</AppText>
        <View style={styles.card}>
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
            {client.membership_paused ? ' · Paused' : ''}
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
        </View>
      </View>

      {recentQuotes.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="sectionLabel">{t('clientDetail.quotes')}</AppText>
            <Pressable onPress={() => navigateAway(`/quotes?client=${clientId}`)}>
              <AppText variant="caption" style={styles.link}>
                View all
              </AppText>
            </Pressable>
          </View>
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
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="sectionLabel">{t('clientDetail.vehicles')}</AppText>
          <Pressable onPress={() => navigateAway(`/clients/${clientId}/vehicles/new`)}>
            <AppText variant="caption" style={styles.link}>
              + Add
            </AppText>
          </Pressable>
        </View>
        {vehicles.length === 0 ? (
          <View style={styles.emptyVehicle}>
            <AppText variant="bodySemiBold">{t('clientDetail.addVehicle')}</AppText>
            <AppText variant="caption" style={styles.muted}>
              Document pre-existing damage on each vehicle.
            </AppText>
            <PrimaryButton
              label={t('clientDetail.addVehicle')}
              onPress={() => navigateAway(`/clients/${clientId}/vehicles/new`)}
            />
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <ListRow
              key={vehicle.id}
              title={vehicleDisplayName(vehicle)}
              subtitle={vehicle.plate ?? vehicle.color ?? 'View damage docs'}
              icon={
                <VehicleTypeIcon type={vehicle.type} size={18} color={iconTonePalette.blue.fg} />
              }
              iconTone="blue"
              onPress={() => navigateAway(`/(tabs)/clients/${clientId}/vehicles/${vehicle.id}`)}
            />
          ))
        )}
      </View>

      {parentClient ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">Parent account</AppText>
          <ListRow
            title={parentClient.name}
            subtitle="Dealer / fleet"
            icon={<Users size={18} color={iconTonePalette.purple.fg} weight="duotone" />}
            iconTone="purple"
            onPress={() => navigateAway(`/(tabs)/clients/${parentClient.id}`)}
          />
        </View>
      ) : null}

      {!client.parent_client_id ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="sectionLabel">Sub-customers</AppText>
            <Pressable onPress={() => navigateAway(`/clients/new?parent=${clientId}`)}>
              <AppText variant="caption" style={styles.link}>
                + Add
              </AppText>
            </Pressable>
          </View>
          {childClients.length === 0 ? (
            <AppText variant="caption" style={styles.muted}>
              Nest end customers under this dealer or fleet.
            </AppText>
          ) : (
            childClients.map((child) => (
              <ListRow
                key={child.id}
                title={child.name}
                subtitle={child.phone ?? child.email ?? 'Sub-customer'}
                icon={<Users size={18} color={iconTonePalette.purple.fg} weight="duotone" />}
                iconTone="purple"
                onPress={() => navigateAway(`/(tabs)/clients/${child.id}`)}
              />
            ))
          )}
        </View>
      ) : null}

      {upcomingJobs.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('clientDetail.upcoming')}</AppText>
          {upcomingJobs.map((job) => (
            <ListRow
              key={job.id}
              icon={<Car size={18} color={iconTonePalette.amber.fg} weight="duotone" />}
              iconTone={jobListIconTone(job)}
              title={job.package?.name ?? t('jobDetail.titleFallback')}
              subtitle={`${formatJobDate(job.date)} · Tap to complete`}
              badgeLabel={t(`jobs.status.${jobListStatusKey(job)}`)}
              badgeTone={jobListBadgeTone(job)}
              trailing={<AppText variant="bodySemiBold" style={styles.amount}>{fmt(job.revenue + job.tip)}</AppText>}
              onPress={() => openJob(job.id)}
            />
          ))}
        </View>
      ) : null}

      {pastJobs.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('clientDetail.jobHistory')}</AppText>
          <View style={styles.groupCard}>
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
          </View>
        </View>
      ) : null}

      {variant === 'screen' && client.phone ? (
        <View style={styles.section}>
          <AppText variant="sectionLabel">{t('clientDetail.contact')}</AppText>
          <SecondaryButton label={t('clientDetail.call')} onPress={() => void handleCallClient()} />
          <SecondaryButton label={t('clientDetail.text')} onPress={() => void handleTextClient()} />
        </View>
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

function StatCell({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  return (
    <View style={styles.statCell}>
      <AppText variant="caption" style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="bodySemiBold" style={cap ? styles.capValue : undefined}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
  },
  overlayHeader: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.green,
  },
  directionsLabel: {
    color: colors.greenText,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  editLabel: {
    color: colors.greenText,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCell: {
    width: '46%',
    gap: 2,
  },
  statLabel: {
    color: colors.textMuted,
  },
  capValue: {
    textTransform: 'capitalize',
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: colors.greenText,
  },
  amount: {
    color: colors.greenText,
  },
  emptyVehicle: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
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
