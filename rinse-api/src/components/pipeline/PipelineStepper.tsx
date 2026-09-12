'use client'

import { Fragment } from 'react'
import { LEAD_STAGES } from '@/lib/lead-sources'
import type { LeadStage } from '@/lib/types'

const STAGE_ORDER: LeadStage[] = ['inquiry', 'quoted', 'booked']

interface Props {
  stageCounts: Record<LeadStage, number>
  activeStage: LeadStage
  onStageChange: (stage: LeadStage) => void
}

export default function PipelineStepper({ stageCounts, activeStage, onStageChange }: Props) {
  const activeIndex = STAGE_ORDER.indexOf(activeStage)

  return (
    <div className="pipeline-stepper" role="tablist" aria-label="Pipeline stages">
      {STAGE_ORDER.map((stage, index) => {
        const meta = LEAD_STAGES.find((s) => s.id === stage)
        const count = stageCounts[stage]
        const isCurrent = index === activeIndex
        const isDone = index < activeIndex
        const showConnector = index < STAGE_ORDER.length - 1
        const connectorLit = index < activeIndex

        return (
          <Fragment key={stage}>
            <button
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={`pipeline-stepper__step${isCurrent ? ' pipeline-stepper__step--current' : ''}`}
              onClick={() => onStageChange(stage)}
            >
              <span
                className={[
                  'pipeline-stepper__node',
                  isDone ? 'pipeline-stepper__node--done' : '',
                  isCurrent ? 'pipeline-stepper__node--current' : '',
                  !isCurrent && !isDone && count > 0 ? 'pipeline-stepper__node--has-leads' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {index + 1}
              </span>
              <span
                className={[
                  'pipeline-stepper__name',
                  isCurrent || isDone ? 'pipeline-stepper__name--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {meta?.shortLabel ?? stage}
              </span>
              <span className="pipeline-stepper__count">{count}</span>
            </button>
            {showConnector ? (
              <div
                className={`pipeline-stepper__line${connectorLit ? ' pipeline-stepper__line--lit' : ''}`}
                aria-hidden="true"
              />
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
