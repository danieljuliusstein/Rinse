'use client'

import { useEffect, useState } from 'react'
import QuotesList from '@/components/QuotesList'
import { ScreenLoading } from '@/components/ui'
import { getQuotes } from '@/lib/api'
import type { QuoteWithRelations } from '@/lib/types'

export default function QuotesPageClient() {
  const [quotes, setQuotes] = useState<QuoteWithRelations[] | null>(null)

  useEffect(() => {
    getQuotes().then(setQuotes)
  }, [])

  if (!quotes) {
    return <ScreenLoading body />
  }

  return <QuotesList quotes={quotes} />
}
