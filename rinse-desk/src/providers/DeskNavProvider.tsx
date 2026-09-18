import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PageId } from '@/lib/types'

export type CalendarDraftRequest = {
  clientId: string
  title?: string
}

export type SettingsSectionId =
  | 'business'
  | 'preferences'
  | 'notifications'
  | 'account'
  | 'workspace'
  | 'schedule'

export type ReceiptsSegment = 'expenses' | 'payments'

interface DeskNavContextValue {
  page: PageId
  setPage: (id: PageId) => void
  focusContactId: string | null
  openContact: (id: string) => void
  clearFocusContact: () => void
  calendarDraft: CalendarDraftRequest | null
  openCalendarDraft: (draft: CalendarDraftRequest) => void
  clearCalendarDraft: () => void
  focusSettingsSection: SettingsSectionId | null
  openSettings: (section?: SettingsSectionId) => void
  clearFocusSettings: () => void
  focusInvoiceId: string | null
  openInvoice: (id: string) => void
  clearFocusInvoice: () => void
  receiptsSegment: ReceiptsSegment | null
  openReceipts: (segment?: ReceiptsSegment) => void
  clearReceiptsSegment: () => void
  focusVehicleId: string | null
  openVehicle: (id: string) => void
  clearFocusVehicle: () => void
  /** Open the interactive product tour (Help → Take the tour). */
  openOnboardingTour: () => void
}

const DeskNavContext = createContext<DeskNavContextValue | null>(null)

export function DeskNavProvider({
  page,
  setPage,
  openOnboardingTour,
  children,
}: {
  page: PageId
  setPage: (id: PageId) => void
  openOnboardingTour: () => void
  children: ReactNode
}) {
  const [focusContactId, setFocusContactId] = useState<string | null>(null)
  const [calendarDraft, setCalendarDraft] = useState<CalendarDraftRequest | null>(null)
  const [focusSettingsSection, setFocusSettingsSection] = useState<SettingsSectionId | null>(null)
  const [focusInvoiceId, setFocusInvoiceId] = useState<string | null>(null)
  const [receiptsSegment, setReceiptsSegment] = useState<ReceiptsSegment | null>(null)
  const [focusVehicleId, setFocusVehicleId] = useState<string | null>(null)

  const openContact = useCallback(
    (id: string) => {
      setFocusContactId(id)
      setPage('contacts')
    },
    [setPage],
  )

  const clearFocusContact = useCallback(() => setFocusContactId(null), [])

  const openCalendarDraft = useCallback(
    (draft: CalendarDraftRequest) => {
      setCalendarDraft(draft)
      setPage('calendar')
    },
    [setPage],
  )

  const clearCalendarDraft = useCallback(() => setCalendarDraft(null), [])

  const openSettings = useCallback(
    (section?: SettingsSectionId) => {
      setFocusSettingsSection(section ?? 'preferences')
      setPage('settings')
    },
    [setPage],
  )

  const clearFocusSettings = useCallback(() => setFocusSettingsSection(null), [])

  const openInvoice = useCallback(
    (id: string) => {
      setFocusInvoiceId(id)
      setPage('invoices')
    },
    [setPage],
  )

  const clearFocusInvoice = useCallback(() => setFocusInvoiceId(null), [])

  const openReceipts = useCallback(
    (segment?: ReceiptsSegment) => {
      setReceiptsSegment(segment ?? 'expenses')
      setPage('receipts')
    },
    [setPage],
  )

  const clearReceiptsSegment = useCallback(() => setReceiptsSegment(null), [])

  const openVehicle = useCallback(
    (id: string) => {
      setFocusVehicleId(id)
      setPage('cars')
    },
    [setPage],
  )

  const clearFocusVehicle = useCallback(() => setFocusVehicleId(null), [])

  const value = useMemo(
    () => ({
      page,
      setPage,
      focusContactId,
      openContact,
      clearFocusContact,
      calendarDraft,
      openCalendarDraft,
      clearCalendarDraft,
      focusSettingsSection,
      openSettings,
      clearFocusSettings,
      focusInvoiceId,
      openInvoice,
      clearFocusInvoice,
      receiptsSegment,
      openReceipts,
      clearReceiptsSegment,
      focusVehicleId,
      openVehicle,
      clearFocusVehicle,
      openOnboardingTour,
    }),
    [
      page,
      setPage,
      focusContactId,
      openContact,
      clearFocusContact,
      calendarDraft,
      openCalendarDraft,
      clearCalendarDraft,
      focusSettingsSection,
      openSettings,
      clearFocusSettings,
      focusInvoiceId,
      openInvoice,
      clearFocusInvoice,
      receiptsSegment,
      openReceipts,
      clearReceiptsSegment,
      focusVehicleId,
      openVehicle,
      clearFocusVehicle,
      openOnboardingTour,
    ],
  )

  return <DeskNavContext.Provider value={value}>{children}</DeskNavContext.Provider>
}

export function useDeskNav() {
  const ctx = useContext(DeskNavContext)
  if (!ctx) throw new Error('useDeskNav must be used within DeskNavProvider')
  return ctx
}
