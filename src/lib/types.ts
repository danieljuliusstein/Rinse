export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'paid'
export type LeadStage = 'inquiry' | 'quoted' | 'booked'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled'
export type DepositStatus = 'none' | 'due' | 'paid' | 'waived'
/** Matches mobile / `@rinse/core` VehicleType (not desk-only coupe). */
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'boat' | 'other'
export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly' | 'none'

export type PageId =
  | 'dashboard'
  | 'deals'
  | 'money'
  | 'invoices'
  | 'receipts'
  | 'cars'
  | 'contacts'
  | 'calendar'
  | 'activities'
  | 'campaigns'
  | 'forms'
  | 'automations'
  | 'chat'
  | 'ai'
  | 'settings'
  | 'help'

export interface DeskClient {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  /** Cached geocode from address (PocketBase clients.lat/lng). */
  lat?: number
  lng?: number
  geocoded_at?: string
  lead_source?: string
  notes?: string
  parent_client_id?: string
  tags?: string[]
  membership_cadence?: RecurrenceCadence
  membership_paused?: boolean
  membership_next_visit?: string
  created?: string
}

export interface DeskVehicle {
  id: string
  client_id: string
  year?: number
  make: string
  model: string
  color?: string
  /** Hex swatch from mobile (`color_hex`). */
  color_hex?: string
  type: VehicleType
  plate?: string
  vin?: string
  /** Optional vehicle photo URL string from PocketBase (same field mobile maps). */
  photo_url?: string
}

export interface DeskJob {
  id: string
  date: string
  start_time?: string
  status: JobStatus
  revenue: number
  tip: number
  client_id: string
  package_id: string
  notes?: string
  location_type?: string
  vehicle_type?: string
  route_order?: number
  deposit_status?: DepositStatus
  deposit_amount?: number
  invoice_id?: string
  /** Duration in hours (used by calendar resize). Defaults to 1 when timed. */
  hours_worked?: number
  client?: DeskClient
  packageName?: string
  created?: string
  updated?: string
}

export interface DeskLead {
  id: string
  name: string
  phone?: string
  email?: string
  stage: LeadStage
  source?: string
  vehicle_type?: string
  service_interest?: string
  quote_amount: number
  package_id?: string
  client_id?: string
  job_id?: string
  notes?: string
  packageName?: string
  created?: string
}

export interface DeskInvoice {
  id: string
  invoice_number: string
  job_id: string
  client_id: string
  subtotal: number
  tip: number
  total: number
  status: InvoiceStatus
  amount_paid: number
  balance_due: number
  paid_at?: string
  sent_at?: string
  created?: string
}

export interface DeskQuote {
  id: string
  quote_number: string
  job_id?: string
  client_id: string
  package_id: string
  subtotal: number
  status: string
  date?: string
}

export interface DeskExpense {
  id: string
  amount: number
  /** Display label — maps from PocketBase `name` (mobile) with `description` fallback. */
  name: string
  /** Alias of `name` for existing Desk UI; prefer `name` in new code. */
  description: string
  date: string
  category?: string
  vendor?: string
  /** Computed at list/map time with PB file token — never persist to PB. */
  receipt_url?: string
}

export interface DeskPackage {
  id: string
  name: string
  base_price: number
  active: boolean
}

/** Time-off / unavailable blocks (`time_blocks`) — shared with mobile. */
export interface DeskTimeBlock {
  id: string
  date: string
  start_time?: string
  end_time?: string
  all_day: boolean
  label?: string
}

export type ActivityType = 'call' | 'email' | 'note' | 'meeting'

export interface DeskActivity {
  id: string
  contact_id: string
  deal_id?: string
  type: ActivityType
  subject: string
  body?: string
  occurred_at: string
  created?: string
  /** Outbound when set (orgStore / future PB). Prefer activity-meta for PB-less path. */
  direction?: 'in' | 'out'
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type CampaignChannel = 'email' | 'sms' | 'ads' | 'other'

export interface DeskCampaign {
  id: string
  name: string
  status: CampaignStatus
  audience_ids: string[]
  subject?: string
  body?: string
  channel: CampaignChannel
  stats_sent: number
  stats_opened: number
  /** Unique recipients who clicked a link (Resend `email.clicked`). */
  stats_clicked: number
  created?: string
}

/** Per-recipient Resend correlation row (PocketBase `campaign_sends`). */
export interface DeskCampaignSend {
  id: string
  organization_id: string
  campaign_id: string
  contact_id: string
  resend_email_id: string
  to_email: string
  opened_at?: string
  clicked_at?: string
  created?: string
}

/** Result from live mail service or local mock send. */
export type CampaignSendSummary = {
  campaign: DeskCampaign
  mode: 'live' | 'mock'
  sent: number
  skipped: number
  errors: string[]
  /** Contact ids that received mail (live) or all audience (mock). */
  contactIds?: string[]
}

export type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'hidden'

export type FieldMapTo = 'name' | 'email' | 'phone' | 'company' | null

export interface DeskFormField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
  mapTo?: FieldMapTo
  width?: 'full' | 'half'
}

export interface DeskFormStyle {
  /** Preset id when last applied; custom edits may leave it set */
  preset?: 'clean' | 'bold' | 'minimal' | 'dark' | 'editorial'
  fontFamily?: string
  formWidth?: 'sm' | 'md' | 'lg' | 'full'
  backgroundColor?: string
  backgroundImage?: string
  padding?: number
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  labelColor?: string
  labelSize?: number
  labelWeight?: 400 | 500 | 600 | 700
  helpColor?: string
  inputStyle?: 'box' | 'underline' | 'filled'
  inputBackground?: string
  inputBorderColor?: string
  inputTextColor?: string
  inputPlaceholderColor?: string
  inputRadius?: number
  inputHeight?: number
  fieldGap?: number
  buttonBackground?: string
  buttonTextColor?: string
  buttonRadius?: number
  buttonHeight?: number
  buttonFullWidth?: boolean
  buttonShadow?: boolean
  heading?: string
  headingColor?: string
  headingSize?: number
  description?: string
  descriptionColor?: string
}

export interface DeskFormSettings {
  submitLabel?: string
  successMessage?: string
  redirectUrl?: string
  style?: DeskFormStyle
}

export interface DeskForm {
  id: string
  name: string
  fields: DeskFormField[]
  settings?: DeskFormSettings
  status: 'draft' | 'live'
  created?: string
}

export interface DeskFormSubmission {
  id: string
  form_id: string
  contact_id?: string
  payload: Record<string, string>
  created?: string
}

export type ChatSender = 'visitor' | 'agent'

export interface DeskChatThread {
  id: string
  visitor_name: string
  visitor_email?: string
  contact_id?: string
  status: 'open' | 'closed'
  last_message_at: string
  pinned?: boolean
  archived?: boolean
  draft_body?: string
  agent_last_read_at?: string
  assignee_id?: string
  spam?: boolean
  trashed?: boolean
  label_ids?: string[]
  created?: string
}

export interface DeskChatMessage {
  id: string
  thread_id: string
  sender: ChatSender
  body: string
  created: string
}

export type AutomationTrigger = 'form_submitted' | 'deal_stage_changed' | 'activity_logged' | 'chat_message'
export type AutomationAction = 'create_activity' | 'update_contact_tag' | 'notify'

export type AutomationNodeType = 'trigger' | 'action' | 'condition'
export type AutomationConditionOp = 'equals' | 'not_equals' | 'exists'

export interface AutomationNodeData {
  /** Action/trigger kind or condition field name */
  kind?: string
  label?: string
  subject?: string
  body?: string
  message?: string
  tag?: string
  /**
   * Optional destination stamp from APP_CATALOG (e.g. slack, stripe).
   * Brands Activity subjects at runtime; does not add a new runnable action kind.
   */
  appId?: string
  /** Condition: ctx key to evaluate */
  field?: string
  op?: AutomationConditionOp
  value?: string
  [key: string]: string | undefined
}

export interface AutomationNode {
  id: string
  type: AutomationNodeType
  position: { x: number; y: number }
  data: AutomationNodeData
}

export interface AutomationEdge {
  id: string
  source: string
  target: string
  /** For condition nodes: which branch */
  sourceHandle?: 'true' | 'false' | string
}

export interface AutomationWorkflow {
  nodes: AutomationNode[]
  edges: AutomationEdge[]
}

export interface DeskAutomation {
  id: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  /** Primary/legacy action — derived from first action node when workflow present */
  action: AutomationAction
  config: Record<string, string>
  workflow?: AutomationWorkflow
  created?: string
}
