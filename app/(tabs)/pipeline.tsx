import { useCallback, useMemo, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useFocusEffect, useRouter } from 'expo-router'
import { Plus } from 'phosphor-react-native'
import type { LeadStage, LeadWithRelations } from '@rinse/core'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { EmptyState, GreenHeaderButton, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { SettingsHeader } from '@/src/components/ui/BackHeaderButton'
import { PipelineLeadRow } from '@/src/components/pipeline/PipelineLeadRow'
import { PipelineStepper } from '@/src/components/pipeline/PipelineStepper'
import {
  firstPipelineStageWithLeads,
  groupLeadsByStage,
  LEAD_STAGES,
} from '@/src/lib/lead-sources'
import { listLeads } from '@/src/lib/leads-api'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'
import { pipelineStageEntering } from '@/src/lib/motion-presets'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { colors, spacing } from '@/src/theme/colors'

export default function PipelineScreen() {
  const router = useRouter()
  const goBack = useSafeBack()
  const dockPadding = useTabDockPadding()
  const reduceMotion = useReduceMotion()
  const stageEntering = useMemo(() => pipelineStageEntering(reduceMotion), [reduceMotion])
  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [stage, setStage] = useState<LeadStage>('inquiry')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const userPickedStageRef = useRef(false)

  const applyLeads = useCallback((next: LeadWithRelations[], preserveStage: boolean) => {
    setLeads(next)
    if (!preserveStage || !userPickedStageRef.current) {
      setStage(firstPipelineStageWithLeads(next))
    }
  }, [])

  const load = useCallback(
    async (opts: { refresh?: boolean; preserveStage?: boolean } = {}) => {
      const { refresh = false, preserveStage = false } = opts
      if (refresh) setRefreshing(true)
      else setLoading(true)
      try {
        applyLeads(await listLeads(), preserveStage)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [applyLeads],
  )

  useFocusEffect(
    useCallback(() => {
      userPickedStageRef.current = false
      void load()
    }, [load]),
  )

  const grouped = useMemo(() => groupLeadsByStage(leads), [leads])

  const stageCounts = useMemo(
    () => ({
      inquiry: grouped.inquiry.length,
      quoted: grouped.quoted.length,
      booked: grouped.booked.length,
    }),
    [grouped],
  )

  const filtered = grouped[stage]
  const stageLabel = LEAD_STAGES.find((s) => s.id === stage)?.label ?? stage
  const stageCount = filtered.length

  return (
    <OperatorScreen
      customHeader={
        <SettingsHeader
          title="Lead Pipeline"
          onBack={goBack}
          right={
            <GreenHeaderButton
              label="New lead"
              onPress={() => router.push('/leads/new')}
              children={<Plus size={18} color="#fff" weight="bold" />}
            />
          }
        />
      }
    >
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load({ refresh: true, preserveStage: true })}
              tintColor={colors.green}
            />
          }
        >
          {leads.length > 0 ? (
            <PipelineStepper
              stageCounts={stageCounts}
              activeStage={stage}
              onStageChange={(next) => {
                userPickedStageRef.current = true
                setStage(next)
              }}
            />
          ) : null}

          {stageCount === 0 ? (
            <EmptyState
              illustration="clients"
              title={leads.length === 0 ? 'No leads yet' : `No leads in ${stageLabel.toLowerCase()}`}
              description={
                leads.length === 0
                  ? 'Add an inquiry or share your booking link to start filling your pipeline.'
                  : 'Move a lead here from another stage, or add a new inquiry.'
              }
              actionLabel="New lead"
              onAction={() => router.push('/leads/new')}
            />
          ) : (
            <Animated.View key={stage} entering={stageEntering}>
              <SectionGroup title={stageLabel.toUpperCase()} meta={String(stageCount)}>
                {filtered.map((lead) => (
                  <PipelineLeadRow
                    key={lead.id}
                    lead={lead}
                    onRefresh={() => void load({ refresh: true, preserveStage: true })}
                  />
                ))}
              </SectionGroup>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    /** Keeps the active-stage glow ring from clipping against the header. */
    paddingTop: spacing.sm,
  },
})
