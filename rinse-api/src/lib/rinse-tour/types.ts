export type TourAdvance = 'next' | 'tap'

/** Where to pin the tour card so it never covers the spotlight. */
export type TourCardMode = 'auto' | 'viewport-top'

export interface RinseTourStep {
  id: string
  /** Group for “Skip this section”. */
  section: string
  /** Navigate before showing this step. */
  route?: string
  /** Element to spotlight. Omit for a centered card. */
  selector?: string
  title: string
  description: string
  /** How the user advances. Default `next`. */
  advance?: TourAdvance
  /** Extra selector that must exist before the step is shown. */
  waitFor?: string
  placement?: 'auto' | 'top' | 'bottom'
  /** Pin card away from bottom sheets / overlapping targets. */
  cardMode?: TourCardMode
  /** Spotlight corner radius in px. Use a large value (e.g. 999) for circular targets. */
  spotlightRadius?: number
  /** Extra padding around the measured target rect. */
  spotlightPad?: number
  /** Circular cutout (FAB, icon buttons). Forces a square spotlight with full corner radius. */
  spotlightShape?: 'rect' | 'circle'
  beforeShow?: () => void | Promise<void>
  afterLeave?: () => void | Promise<void>
}

export interface RinseTourRect {
  top: number
  left: number
  width: number
  height: number
}

export interface RinseTourLayout {
  spotlight: RinseTourRect | null
  cardTop: number
  cardLeft: number
  cardMaxWidth: number
  cardPlacement: 'top' | 'bottom' | 'center'
}

export interface RinseTourState {
  active: boolean
  index: number
  steps: RinseTourStep[]
  step: RinseTourStep | null
  layout: RinseTourLayout | null
  transitioning: boolean
}
