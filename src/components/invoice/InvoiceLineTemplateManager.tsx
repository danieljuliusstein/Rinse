'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { FloatingAffixField, FloatingField, ReorderableList } from '@/components/forms'
import { Button } from '@/components/ui'
import {
  deleteInvoiceLineTemplate,
  getInvoiceLineTemplates,
  saveInvoiceLineTemplate,
} from '@/lib/api'
import type { InvoiceLineTemplate } from '@/lib/types'

export default function InvoiceLineTemplateManager() {
  const [templates, setTemplates] = useState<InvoiceLineTemplate[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [busy, setBusy] = useState(false)

  const refresh = () => {
    void getInvoiceLineTemplates().then(setTemplates)
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAdd = async () => {
    if (!description.trim() || amount <= 0) return
    setBusy(true)
    try {
      await saveInvoiceLineTemplate({ description: description.trim(), default_amount: amount })
      setDescription('')
      setAmount(0)
      refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      await deleteInvoiceLineTemplate(id)
      refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card settings-panel">
      <h2 className="settings-billing-card__title">Line item library</h2>
      <p className="settings-section-desc">
        Reusable lines for multi-item invoices — add them when customizing before send.
      </p>

      <div className="invoice-line-template-form">
        <FloatingField id="line-desc" label="Description" filled={description.trim().length > 0}>
          <input
            id="line-desc"
            className={`f-input${description.trim() ? ' hv' : ''}`}
            placeholder=" "
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FloatingField>
        <FloatingAffixField
          id="line-amt"
          label="Default amount"
          filled={amount > 0}
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void handleAdd()}>
          <Plus size={16} /> Add line
        </Button>
      </div>

      {templates.length > 0 ? (
        <ReorderableList
          className="invoice-line-template-list"
          droppableId="invoice-line-templates"
          items={templates}
          getItemId={(t) => t.id}
          onReorder={setTemplates}
          itemClassName="invoice-line-template-list__item reorderable-list__item"
          renderItem={(t) => (
            <>
              <span>{t.description}</span>
              <span>${t.default_amount}</span>
              <button type="button" aria-label={`Delete ${t.description}`} onClick={() => void handleDelete(t.id)}>
                <Trash size={16} />
              </button>
            </>
          )}
        />
      ) : (
        <p className="settings-field-hint">No saved lines yet.</p>
      )}
    </section>
  )
}
