import * as api from '@/lib/api'
import * as platform from '@/lib/platform-api'
import { geocodeAddressOnce } from '@/lib/geocode-once'
import { todayISO } from '@/lib/metrics'
import { loadAppSettings } from '@/lib/settings-api'
import type { ActivityType, DeskActivity } from '@/lib/types'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useUi } from '@/providers/UiProvider'

/** Shared create flows used by Header and page CTAs. */
export function useCreateActions() {
  const { clients, packages, setClients, setJobs, setLeads, setExpenses, setPackages } = useData()
  const { alert, promptForm, toast } = useUi()
  const { setPage, openContact } = useDeskNav()

  async function createContact(opts?: { navigate?: boolean }) {
    let businessContext: string | undefined
    try {
      const s = await loadAppSettings()
      businessContext = s.business_address?.trim() || undefined
    } catch {
      /* optional */
    }

    const values = await promptForm({
      title: 'New contact',
      submitLabel: 'Create contact',
      fields: [
        { name: 'name', label: 'Name', required: true, placeholder: 'Jane Doe' },
        { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 000-0000' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@shop.com' },
        {
          name: 'address',
          label: 'Address',
          type: 'address',
          placeholder: 'Street address',
          addressContext: businessContext,
        },
      ],
    })
    if (!values?.name) return null

    const address = (values.address || '').trim()
    const pinned = values.address_pinned === '1'
    let lat = pinned ? Number(values.address_lat) : undefined
    let lng = pinned ? Number(values.address_lng) : undefined
    let hasPin = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)

    // Structured fields: geocode once on create (not while typing).
    if (address && !hasPin) {
      const hit = await geocodeAddressOnce(address, { context: businessContext })
      if (hit) {
        lat = hit.lat
        lng = hit.lng
        hasPin = true
      }
    }

    try {
      const created = await api.createClient({
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: address || undefined,
        tags: ['id:Client'],
        ...(hasPin
          ? { lat, lng, geocoded_at: new Date().toISOString() }
          : {}),
      })
      setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast(hasPin ? 'Contact created · address pinned' : 'Contact created')
      if (opts?.navigate !== false) openContact(created.id)
      return created
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create contact', 'Create failed')
      return null
    }
  }

  async function createDeal(opts?: {
    navigate?: boolean
    stage?: 'inquiry' | 'quoted' | 'booked'
    defaultAmount?: string
    defaultName?: string
    clientId?: string
    phone?: string
    email?: string
  }) {
    const values = await promptForm({
      title: 'New deal',
      submitLabel: 'Create deal',
      fields: [
        {
          name: 'name',
          label: 'Lead name',
          required: true,
          placeholder: 'Acme Detailing',
          defaultValue: opts?.defaultName ?? '',
        },
        {
          name: 'amount',
          label: 'Quote amount',
          type: 'number',
          placeholder: '0',
          defaultValue: opts?.defaultAmount ?? '0',
        },
        { name: 'interest', label: 'Service interest', placeholder: 'Full detail' },
      ],
    })
    if (!values?.name) return null
    try {
      const created = await api.createLead({
        name: values.name,
        quote_amount: Number(values.amount) || 0,
        package_id: packages[0]?.id,
        stage: opts?.stage ?? 'inquiry',
        service_interest: values.interest || undefined,
        client_id: opts?.clientId,
        phone: opts?.phone,
        email: opts?.email,
      })
      setLeads((prev) => [created, ...prev])
      toast('Deal created')
      if (opts?.navigate !== false) setPage('deals')
      return created
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create deal', 'Create failed')
      return null
    }
  }

  async function createEvent(opts?: {
    navigate?: boolean
    defaultDate?: string
    startTime?: string
    hoursWorked?: number
    allDay?: boolean
    title?: string
    clientId?: string
    packageId?: string
    /** Override the prompt form chrome (e.g. Routes “Schedule stop”). */
    formTitle?: string
    submitLabel?: string
    /** Skip the form when all needed fields are already provided (calendar drag-create). */
    skipForm?: boolean
  }) {
    if (!clients.length || !packages.length) {
      alert('Add a client and package first.', 'Cannot create event')
      return null
    }

    let date = opts?.defaultDate ?? todayISO()
    let title = opts?.title?.trim() || ''
    let allDay = opts?.allDay === true
    let start_time = allDay ? undefined : opts?.startTime || '09:00'
    let hours_worked = allDay ? 0 : opts?.hoursWorked && opts.hoursWorked > 0 ? opts.hoursWorked : 1
    let client = clients.find((c) => c.id === opts?.clientId) ?? clients[0]!
    let pkg = packages.find((p) => p.id === opts?.packageId) ?? packages.filter((p) => p.active)[0] ?? packages[0]!

    if (!opts?.skipForm) {
      const values = await promptForm({
        title: opts?.formTitle ?? 'New event',
        submitLabel: opts?.submitLabel ?? 'Create event',
        fields: [
          {
            name: 'title',
            label: 'Title',
            required: true,
            placeholder: 'Mobile detail',
            defaultValue: title || 'New event',
          },
          {
            name: 'client_id',
            label: 'Client',
            type: 'select',
            required: true,
            defaultValue: client.id,
            options: clients.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: 'package_id',
            label: 'Package',
            type: 'select',
            required: true,
            defaultValue: pkg.id,
            options: packages.map((p) => ({
              value: p.id,
              label: p.active ? p.name : `${p.name} (archived)`,
            })),
          },
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true,
            defaultValue: date,
          },
          {
            name: 'start_time',
            label: 'Start time',
            placeholder: '09:00',
            defaultValue: start_time || '09:00',
          },
          {
            name: 'hours',
            label: 'Duration (hours)',
            type: 'number',
            defaultValue: String(hours_worked || 1),
          },
        ],
      })
      if (!values?.title || !values.client_id || !values.package_id) return null
      title = values.title.trim()
      date = values.date || todayISO()
      start_time = values.start_time?.trim() || '09:00'
      hours_worked = Math.max(Number(values.hours) || 1, 0.5)
      allDay = false
      client = clients.find((c) => c.id === values.client_id) ?? client
      pkg = packages.find((p) => p.id === values.package_id) ?? pkg
    }

    if (!title) title = 'New event'

    const tempId = `temp-${Date.now()}`
    const optimistic: import('@/lib/types').DeskJob = {
      id: tempId,
      date,
      start_time,
      status: 'scheduled',
      revenue: pkg.base_price,
      tip: 0,
      client_id: client.id,
      package_id: pkg.id,
      notes: title,
      hours_worked,
      client,
      packageName: pkg.name,
    }
    setJobs((prev) => [optimistic, ...prev])

    try {
      const created = await api.createJob({
        client_id: client.id,
        package_id: pkg.id,
        date,
        start_time,
        notes: title,
        revenue: pkg.base_price,
        hours_worked,
      })
      const hydrated = {
        ...created,
        notes: created.notes || title,
        client: created.client ?? client,
        packageName: created.packageName ?? pkg.name,
      }
      setJobs((prev) => [hydrated, ...prev.filter((j) => j.id !== tempId && j.id !== hydrated.id)])
      toast(opts?.navigate === false ? 'Stop scheduled' : 'Event created')
      if (opts?.navigate !== false) setPage('calendar')
      return hydrated
    } catch (err) {
      setJobs((prev) => prev.filter((j) => j.id !== tempId))
      alert(err instanceof Error ? err.message : 'Could not create event', 'Create failed')
      return null
    }
  }

  async function createActivityAction(opts?: { navigate?: boolean }): Promise<DeskActivity | null> {
    if (!clients.length) {
      alert('Add a contact first.', 'Cannot log activity')
      return null
    }
    const values = await promptForm({
      title: 'Log activity',
      submitLabel: 'Save activity',
      fields: [
        {
          name: 'contact_id',
          label: 'Contact',
          type: 'select',
          required: true,
          defaultValue: clients[0]!.id,
          options: clients.map((c) => ({ value: c.id, label: c.name })),
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          defaultValue: 'note',
          options: [
            { value: 'call', label: 'Call' },
            { value: 'email', label: 'Email' },
            { value: 'meeting', label: 'Meeting' },
            { value: 'note', label: 'Note' },
          ],
        },
        { name: 'subject', label: 'Subject', required: true, placeholder: 'Follow-up' },
        { name: 'body', label: 'Notes', placeholder: 'Optional details' },
      ],
    })
    if (!values?.contact_id || !values.subject) return null
    try {
      const created = await platform.createActivity({
        contact_id: values.contact_id,
        type: (values.type as ActivityType) || 'note',
        subject: values.subject.trim(),
        body: values.body?.trim() || undefined,
      })
      toast('Activity logged')
      if (opts?.navigate !== false) setPage('activities')
      return created
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not log activity', 'Create failed')
      return null
    }
  }

  async function createExpense(opts?: { navigate?: boolean }) {
    const values = await promptForm({
      title: 'Log expense',
      submitLabel: 'Save expense',
      fields: [
        { name: 'description', label: 'Description', required: true, placeholder: 'Supplies / fuel' },
        { name: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0' },
        { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayISO() },
      ],
    })
    if (!values?.description || !values.amount) return null
    try {
      const created = await api.createExpense({
        description: values.description,
        amount: Number(values.amount) || 0,
        date: values.date || todayISO(),
      })
      setExpenses((prev) => [created, ...prev])
      toast('Expense logged')
      if (opts?.navigate !== false) setPage('receipts')
      return created
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not log expense', 'Create failed')
      return null
    }
  }

  async function createPackageAction() {
    const values = await promptForm({
      title: 'New package',
      submitLabel: 'Create package',
      fields: [
        { name: 'name', label: 'Package name', required: true, placeholder: 'Full detail' },
        { name: 'base_price', label: 'Base price', type: 'number', required: true, defaultValue: '0' },
      ],
    })
    if (!values?.name) return null
    try {
      const created = await api.createPackage({
        name: values.name,
        base_price: Number(values.base_price) || 0,
      })
      setPackages((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast('Package created')
      return created
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create package', 'Create failed')
      return null
    }
  }

  return {
    createContact,
    createDeal,
    createEvent,
    createExpense,
    createPackage: createPackageAction,
    createActivity: createActivityAction,
  }
}
