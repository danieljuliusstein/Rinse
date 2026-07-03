'use client'

import { useRef, useState } from 'react'
import { FileCsv, UploadSimple } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import { SheetFooter } from '@/components/forms'
import { Button } from '@/components/ui'
import {
  clientInputFromRow,
  parseClientsCsv,
  vehicleInputFromRow,
  type ClientCsvRow,
} from '@/lib/client-csv'
import { createClient, createVehicle } from '@/lib/api'
import { useActionToast } from '@/providers/ActionToastProvider'

interface ClientImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export default function ClientImportSheet({ open, onOpenChange, onImported }: ClientImportSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ClientCsvRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const { handleWriteError, showMessage } = useActionToast()

  const handleFile = async (file: File) => {
    const text = await file.text()
    const { rows, errors } = parseClientsCsv(text)
    setPreview(rows)
    setParseErrors(errors)
    setDone(false)
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setImporting(true)
    let imported = 0
    try {
      for (const row of preview) {
        const client = await createClient(clientInputFromRow(row))
        const vehicle = vehicleInputFromRow(row, client.id)
        if (vehicle) await createVehicle(vehicle)
        imported++
      }
      setDone(true)
      showMessage(`Imported ${imported} client${imported === 1 ? '' : 's'}`)
      onImported()
      window.setTimeout(() => onOpenChange(false), 1200)
    } catch (e) {
      handleWriteError(e)
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return (
    <BottomSheet
      title="Import clients"
      onClose={() => onOpenChange(false)}
      footer={
        <SheetFooter
          layout="save-only"
          saveLabel={
            preview.length > 0
              ? `Import ${preview.length} client${preview.length === 1 ? '' : 's'}`
              : 'Import clients'
          }
          ready={preview.length > 0 && !importing && !done}
          done={done}
          disabled={preview.length === 0 || importing}
          onSave={() => void handleImport()}
        />
      }
    >
      <p className="form-field-hint">
        CSV columns: name, phone, email, address, vehicle_year, vehicle_make, vehicle_model, vehicle_type, notes
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
        <UploadSimple size={18} aria-hidden="true" /> Choose CSV file
      </Button>

      {parseErrors.length > 0 ? (
        <ul className="form-field-hint form-field-hint--error">
          {parseErrors.slice(0, 5).map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      {preview.length > 0 ? (
        <div className="client-import-preview">
          <div className="client-import-preview__head">
            <FileCsv size={16} aria-hidden="true" />
            {preview.length} row{preview.length === 1 ? '' : 's'} ready
          </div>
          <ul className="client-import-preview__list">
            {preview.slice(0, 6).map((row, i) => (
              <li key={`${row.name}-${i}`}>{row.name}</li>
            ))}
            {preview.length > 6 ? <li>+ {preview.length - 6} more</li> : null}
          </ul>
        </div>
      ) : null}
    </BottomSheet>
  )
}
