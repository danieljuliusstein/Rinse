import { useEffect, useMemo, useState } from 'react'
import { Header } from '../App'
import { useData } from '@/providers/DataProvider'
import { useDeskNav } from '@/providers/DeskNavProvider'
import { useCreateActions } from '@/hooks/useCreateActions'
import { useUi } from '@/providers/UiProvider'
import * as api from '@/lib/api'
import { isPaymentReceiptInvoice, paymentReceiptDate } from '@/lib/invoice-edit'
import { todayISO } from '@/lib/metrics'
import { colors } from '@/theme/colors'
import type { DeskExpense } from '@/lib/types'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { ReceiptsHeader, type ReceiptsSegment } from '@/components/receipts/ReceiptsHeader'
import { ExpensesList } from '@/components/receipts/ExpensesList'
import { EmptyExpenses } from '@/components/receipts/EmptyExpenses'
import { PaymentsList, EmptyPayments, type PaymentRowModel } from '@/components/receipts/PaymentsList'
import { ExpenseEditPanel } from '@/components/receipts/ExpenseEditPanel'
import { InvoicePeek } from '@/components/receipts/InvoicePeek'

export default function ReceiptsPage() {
  const { expenses, invoices, clients, jobs, setExpenses } = useData()
  const { receiptsSegment, clearReceiptsSegment, openInvoice } = useDeskNav()
  const { createExpense } = useCreateActions()
  const { toast, alert } = useUi()

  const [segment, setSegment] = useState<ReceiptsSegment>('expenses')
  const [search, setSearch] = useState('')
  const [lightboxExpense, setLightboxExpense] = useState<DeskExpense | null>(null)
  const [editExpense, setEditExpense] = useState<DeskExpense | null>(null)
  const [peekPayment, setPeekPayment] = useState<PaymentRowModel | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!receiptsSegment) return
    if (receiptsSegment === 'expenses' || receiptsSegment === 'payments') {
      setSegment(receiptsSegment)
    }
    clearReceiptsSegment()
  }, [receiptsSegment, clearReceiptsSegment])

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) || 'Client'
  }, [clients])

  const jobSubtitle = useMemo(() => {
    const map = new Map(jobs.map((j) => [j.id, j]))
    return (jobId: string) => {
      const job = map.get(jobId)
      if (!job) return undefined
      return job.packageName || job.vehicle_type || undefined
    }
  }, [jobs])

  const payments = useMemo(() => {
    return invoices
      .filter(isPaymentReceiptInvoice)
      .slice()
      .sort((a, b) => paymentReceiptDate(b).localeCompare(paymentReceiptDate(a)))
      .map(
        (inv): PaymentRowModel => ({
          invoice: inv,
          clientName: clientName(inv.client_id),
          subtitle: jobSubtitle(inv.job_id),
        }),
      )
  }, [invoices, clientName, jobSubtitle])

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter((e) => {
      if (!q) return true
      return [e.name, e.description, e.vendor, e.category, String(e.amount)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [expenses, search])

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      if (!q) return true
      return [p.invoice.invoice_number, p.invoice.status, p.clientName, String(p.invoice.amount_paid)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [payments, search])

  async function saveExpense(values: {
    description: string
    amount: number
    date: string
    category: string
  }) {
    if (!editExpense || savingId) return
    setSavingId(editExpense.id)
    try {
      const updated = await api.updateExpense(editExpense.id, {
        description: values.description,
        amount: values.amount,
        date: values.date || todayISO(),
        category: values.category,
      })
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      toast('Expense updated')
      setEditExpense(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update expense', 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  function logExpense() {
    void createExpense({ navigate: false })
  }

  const showEmptyExpenses = segment === 'expenses' && filteredExpenses.length === 0
  const showEmptyPayments = segment === 'payments' && filteredPayments.length === 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ink-100">
      <Header
        title="Receipts"
        subtitle="Expense paper trail + payment receipts from settled invoices"
        actions={
          <button
            type="button"
            onClick={logExpense}
            disabled={segment !== 'expenses'}
            title={
              segment !== 'expenses'
                ? 'Payments are derived from invoices — log them in Invoices'
                : undefined
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ background: colors.green }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Log expense
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        <ReceiptsHeader
          segment={segment}
          onSegmentChange={(s) => {
            setSegment(s)
            setSearch('')
          }}
          expenseCount={expenses.length}
          paymentCount={payments.length}
          query={search}
          onQueryChange={setSearch}
        />

        <div className="pb-10">
          {segment === 'expenses' ? (
            showEmptyExpenses ? (
              search.trim() ? (
                <EmptyExpenses variant="no-results" query={search} onLog={logExpense} />
              ) : (
                <EmptyExpenses onLog={logExpense} />
              )
            ) : (
              <ExpensesList
                expenses={filteredExpenses}
                onOpenReceipt={(e) => {
                  if (e.receipt_url) setLightboxExpense(e)
                }}
                onEdit={setEditExpense}
              />
            )
          ) : showEmptyPayments ? (
            <EmptyPayments query={search.trim() || undefined} />
          ) : (
            <PaymentsList payments={filteredPayments} onOpenInvoice={setPeekPayment} />
          )}
        </div>
      </div>

      {lightboxExpense?.receipt_url ? (
        <PhotoLightbox
          open
          title={lightboxExpense.name || lightboxExpense.description || 'Expense receipt'}
          url={lightboxExpense.receipt_url}
          onClose={() => setLightboxExpense(null)}
        />
      ) : null}

      <ExpenseEditPanel
        expense={editExpense}
        saving={savingId === editExpense?.id}
        onClose={() => setEditExpense(null)}
        onSave={(values) => void saveExpense(values)}
      />

      <InvoicePeek
        invoice={peekPayment?.invoice ?? null}
        clientName={peekPayment?.clientName ?? ''}
        subtitle={peekPayment?.subtitle}
        onClose={() => setPeekPayment(null)}
        onOpenInvoices={() => {
          const id = peekPayment?.invoice.id
          setPeekPayment(null)
          if (id) openInvoice(id)
        }}
      />
    </div>
  )
}
