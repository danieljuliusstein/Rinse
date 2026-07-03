'use client'

import { useEffect, useState } from 'react'
import InvoicesList from '@/components/InvoicesList'
import { ScreenLoading } from '@/components/ui'
import { getClients, getInvoices } from '@/lib/api'
import type { Client, Invoice } from '@/lib/types'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    Promise.all([getInvoices(), getClients()]).then(([inv, cls]) => {
      setInvoices(inv)
      setClients(cls)
    })
  }, [])

  if (!invoices) {
    return <ScreenLoading />
  }

  return <InvoicesList invoices={invoices} clients={clients} />
}
