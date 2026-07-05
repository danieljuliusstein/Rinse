'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QuoteDetail from '@/components/QuoteDetail'
import { ScreenLoading } from '@/components/ui'
import { getQuote } from '@/lib/api'
import type { QuoteWithRelations } from '@/lib/types'

export default function QuoteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [quote, setQuote] = useState<QuoteWithRelations | null>(null)

  useEffect(() => {
    getQuote(id).then(setQuote)
  }, [id])

  if (!quote) {
    return <ScreenLoading variant="detail" />
  }

  return <QuoteDetail quote={quote} />
}
