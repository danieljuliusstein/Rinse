'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Plus } from '@phosphor-icons/react'
import AuthEmptyState from '@/components/AuthEmptyState'
import BackButton from '@/components/BackButton'
import PipelineLeadCard from '@/components/pipeline/PipelineLeadCard'
import PipelineStepper from '@/components/pipeline/PipelineStepper'
import { ActionDock, EmptyState, Button, ScreenLoading, SectionGroup } from '@/components/ui'
import { useAuthEmptyState } from '@/hooks/useAuthEmptyState'
import { useQuickAction } from '@/providers/QuickActionContext'
import { getLeads } from '@/lib/api'
import { isLeadsCollectionMissing, LEADS_MIGRATION_BANNER } from '@/lib/api/leads-migration'
import { LEAD_STAGES } from '@/lib/lead-sources'
import type { LeadStage, LeadWithRelations } from '@/lib/types'

const STAGE_PRIORITY: LeadStage[] = ['booked', 'quoted', 'inquiry']

function firstStageWithLeads(leads: LeadWithRelations[]): LeadStage {
  for (const stage of STAGE_PRIORITY) {
    if (leads.some((l) => l.stage === stage)) return stage
  }
  return 'inquiry'
}

export default function PipelineScreen() {
  const router = useRouter()
  const { isLoggedOut } = useAuthEmptyState()
  const { openLeadSheet } = useQuickAction()
  const [leads, setLeads] = useState<LeadWithRelations[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [activeStage, setActiveStage] = useState<LeadStage>('inquiry')
  const [stageInitialized, setStageInitialized] = useState(false)

  const load = () => {
    getLeads()
      .then((next) => {
        setLeads(next)
        setError(null)
        setMigrationNeeded(isLeadsCollectionMissing())
      })
      .catch((e) => {
        setLeads([])
        setError(e instanceof Error ? e.message : 'Failed to load pipeline')
      })
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const onChanged = () => load()
    window.addEventListener('leads-changed', onChanged)
    return () => window.removeEventListener('leads-changed', onChanged)
  }, [])

  const grouped = useMemo(() => {
    const map: Record<LeadStage, LeadWithRelations[]> = { inquiry: [], quoted: [], booked: [] }
    for (const lead of leads ?? []) map[lead.stage].push(lead)
    return map
  }, [leads])

  useEffect(() => {
    if (!leads?.length || stageInitialized) return
    setActiveStage(firstStageWithLeads(leads))
    setStageInitialized(true)
  }, [leads, stageInitialized])

  const handleRefresh = () => {
    load()
    window.dispatchEvent(new Event('leads-changed'))
  }

  const isEmpty = (leads?.length ?? 0) === 0
  const activeLabel = LEAD_STAGES.find((s) => s.id === activeStage)?.label ?? activeStage
  const stageCount = grouped[activeStage].length

  return (
    <div className={`screen page-content body${!isEmpty && !isLoggedOut ? ' screen--dock-nav' : ''}`}>
      <header className="page-header page-header--compact pipeline-page-header">
        <BackButton onClick={() => router.push('/')} />
        <div className="page-header__title-block">
          <div>
            <h1>Lead pipeline</h1>
            <p>
              {!leads
                ? 'Loading leads…'
                : isLoggedOut
                  ? 'Sign in to load your pipeline'
                  : `${leads.length} lead${leads.length === 1 ? '' : 's'} · ${activeLabel}`}
            </p>
          </div>
        </div>
      </header>

      {!isEmpty && leads ? (
        <div data-coach="pipeline-stages">
          <PipelineStepper
            activeStage={activeStage}
            stageCounts={{
              inquiry: grouped.inquiry.length,
              quoted: grouped.quoted.length,
              booked: grouped.booked.length,
            }}
            onStageChange={setActiveStage}
          />
        </div>
      ) : null}

      {migrationNeeded ? (
        <div className="error-banner" role="status">
          {LEADS_MIGRATION_BANNER}
        </div>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}

      {!leads ? (
        <ScreenLoading inline />
      ) : isLoggedOut ? (
        <AuthEmptyState
          icon={<Car size={28} weight="duotone" />}
          title="Sign in to see your pipeline"
          subtitle="Leads and inquiries load from your account after you sign in."
        />
      ) : isEmpty ? (
        <EmptyState
          illustration="pipeline"
          title="No leads yet"
          description="Add an inquiry or share your booking link to start filling your pipeline."
          actionLabel="New lead"
          onAction={() => openLeadSheet()}
        />
      ) : (
        <div key={activeStage} className="pipeline-stage-panel pipeline-stage-panel--animate">
          {stageCount === 0 ? (
            <EmptyState
              title={`No leads in ${activeLabel.toLowerCase()}`}
              description="Move a lead here from another stage, or add a new inquiry."
              actionLabel="New lead"
              onAction={() => openLeadSheet()}
            />
          ) : (
            <SectionGroup title={activeLabel} meta={String(stageCount)}>
              {grouped[activeStage].map((lead) => (
                <PipelineLeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={() => openLeadSheet(lead)}
                  onRefresh={handleRefresh}
                />
              ))}
            </SectionGroup>
          )}
        </div>
      )}

      {!isEmpty && !isLoggedOut ? (
        <ActionDock aboveNav>
          <Button
            variant="primary"
            className="ui-action-dock__btn ui-action-dock__btn--primary"
            data-coach="pipeline-add"
            onClick={() => openLeadSheet()}
          >
            <Plus size={18} weight="bold" aria-hidden="true" /> New lead
          </Button>
        </ActionDock>
      ) : null}
    </div>
  )
}
