import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import {
  CLIENT_CSV_FIELD_OPTIONS,
  detectCsvHeaders,
  mapCsvRows,
  parseCsvLine,
  type ClientCsvField,
} from '@/lib/client-csv-import'
import { createClient, createVehicle } from '@/lib/api'

type Step = 'source' | 'mapping' | 'preview'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (importedCount: number) => void
}

export function ClientCsvImportModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('source')
  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [dataLines, setDataLines] = useState<string[]>([])
  const [mapping, setMapping] = useState<ClientCsvField[]>([])
  const [sampleValues, setSampleValues] = useState<string[]>([])
  const [pasteMode, setPasteMode] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const { rows: mappedRows, errors: mappingErrors } = useMemo(
    () => mapCsvRows(dataLines, mapping),
    [dataLines, mapping],
  )

  const hasName = mapping.includes('name')

  if (!isOpen) return null

  const handleFileUpload = (file: File) => {
    setError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '')
      if (!text.trim()) {
        setError('The selected file is empty.')
        return
      }
      setCsvText(text)
      processRawCsv(text)
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }

  const processRawCsv = (text: string) => {
    setError(null)
    const detected = detectCsvHeaders(text)
    if (detected.headers.length === 0 || detected.dataLines.length === 0) {
      setError('Could not detect valid data rows. Ensure your CSV has at least one row of contacts.')
      return
    }
    setHeaders(detected.headers)
    setDataLines(detected.dataLines)
    setMapping(detected.mapping)

    if (detected.dataLines.length > 0) {
      const firstRowCells = parseCsvLine(detected.dataLines[0])
      setSampleValues(firstRowCells)
    } else {
      setSampleValues([])
    }

    setStep('mapping')
  }

  const handleFieldChange = (index: number, nextField: ClientCsvField) => {
    setMapping((prev) => {
      const copy = [...prev]
      if (nextField !== 'skip') {
        // Enforce uniqueness for single-target fields
        for (let i = 0; i < copy.length; i++) {
          if (i !== index && copy[i] === nextField) copy[i] = 'skip'
        }
      }
      copy[index] = nextField
      return copy
    })
  }

  const handleImport = async () => {
    if (mappedRows.length === 0) return
    setImporting(true)
    setProgress({ current: 0, total: mappedRows.length })
    setError(null)

    let successCount = 0
    try {
      for (let i = 0; i < mappedRows.length; i++) {
        const row = mappedRows[i]
        try {
          const client = await createClient({
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            notes: row.notes,
          })

          if (row.vehicle_make?.trim() || row.vehicle_model?.trim()) {
            try {
              await createVehicle({
                client_id: client.id,
                year: row.vehicle_year,
                make: row.vehicle_make?.trim() || 'Unknown',
                model: row.vehicle_model?.trim() || 'Vehicle',
                type: row.vehicle_type ?? 'sedan',
              })
            } catch {
              // Non-fatal vehicle creation
            }
          }
          successCount++
        } catch (e) {
          // Log or count failure
        }
        setProgress({ current: i + 1, total: mappedRows.length })
      }

      onSuccess(successCount)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Import Contacts</h2>
              <p className="text-xs text-ink-500">Add clients in bulk from CSV, Excel, or Square</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper bar */}
        <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/50 px-6 py-2.5 text-xs">
          <span className={`font-medium ${step === 'source' ? 'text-brand-600 font-semibold' : 'text-ink-500'}`}>
            1. Select File
          </span>
          <ChevronRight size={14} className="text-ink-300" />
          <span className={`font-medium ${step === 'mapping' ? 'text-brand-600 font-semibold' : 'text-ink-500'}`}>
            2. Map Columns
          </span>
          <ChevronRight size={14} className="text-ink-300" />
          <span className={`font-medium ${step === 'preview' ? 'text-brand-600 font-semibold' : 'text-ink-500'}`}>
            3. Preview & Import
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'source' && (
            <div className="space-y-4">
              {!pasteMode ? (
                <div>
                  <label
                    htmlFor="csv-file-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/40 p-8 transition hover:border-brand-400 hover:bg-brand-50/20"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <FileUp size={22} />
                    </div>
                    <span className="text-sm font-semibold text-ink-900">
                      Click to upload or drag & drop CSV
                    </span>
                    <span className="mt-1 text-xs text-ink-500">
                      CSV or plain text exports from Square, Jobber, Housecall, or Excel
                    </span>
                    <input
                      id="csv-file-upload"
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                    />
                  </label>
                  {fileName && (
                    <p className="mt-2 text-center text-xs text-ink-600">
                      Selected: <span className="font-semibold">{fileName}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="csv-raw-textarea" className="text-xs font-medium text-ink-700">
                    Paste raw CSV lines (first line should contain headers):
                  </label>
                  <textarea
                    id="csv-raw-textarea"
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Name,Phone,Email,Address,Vehicle Make,Vehicle Model&#10;John Smith,310-555-0199,john@example.com,123 Ocean Ave,Tesla,Model 3"
                    className="w-full rounded-xl border border-ink-200 p-3 font-mono text-xs text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPasteMode(!pasteMode)}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  {pasteMode ? 'Upload a CSV file instead' : 'Or paste CSV text directly'}
                </button>
                {pasteMode && (
                  <button
                    type="button"
                    onClick={() => processRawCsv(csvText)}
                    disabled={!csvText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    Continue to Mapping
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-600">
                  Match each column from your file to a contact field.
                </p>
                {!hasName && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                    <AlertCircle size={13} /> Name column is required
                  </span>
                )}
              </div>

              <div className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200">
                <div className="grid grid-cols-12 bg-ink-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  <div className="col-span-5">File Column</div>
                  <div className="col-span-3">Sample Value</div>
                  <div className="col-span-4">Rinse Field</div>
                </div>
                {headers.map((header, idx) => {
                  const sample = sampleValues[idx] || '—'
                  const currentMapping = mapping[idx] ?? 'skip'
                  return (
                    <div key={idx} className="grid grid-cols-12 items-center gap-2 px-3.5 py-2.5 text-xs">
                      <div className="col-span-5 font-medium text-ink-900 truncate" title={header}>
                        {header}
                      </div>
                      <div className="col-span-3 text-ink-500 truncate text-[11px]" title={sample}>
                        {sample}
                      </div>
                      <div className="col-span-4">
                        <select
                          value={currentMapping}
                          onChange={(e) => handleFieldChange(idx, e.target.value as ClientCsvField)}
                          className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
                        >
                          {CLIENT_CSV_FIELD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-brand-50/70 p-3 text-xs text-brand-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-brand-600" />
                  <span>
                    Ready to import <strong>{mappedRows.length}</strong> contacts{' '}
                    ({mappedRows.filter((r) => r.vehicle_make || r.vehicle_model).length} with vehicles)
                  </span>
                </div>
              </div>

              {mappingErrors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">Row warnings ({mappingErrors.length}):</p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto text-[11px]">
                    {mappingErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-ink-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ink-50 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Vehicle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {mappedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-ink-50/40">
                        <td className="px-3 py-2 font-medium text-ink-900">{row.name}</td>
                        <td className="px-3 py-2 text-ink-600">{row.phone || '—'}</td>
                        <td className="px-3 py-2 text-ink-600">{row.email || '—'}</td>
                        <td className="px-3 py-2 text-ink-600">
                          {row.vehicle_make || row.vehicle_model
                            ? `${row.vehicle_year ?? ''} ${row.vehicle_make ?? ''} ${row.vehicle_model ?? ''}`.trim()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRows.length > 5 && (
                <p className="text-center text-[11px] text-ink-400">
                  Showing first 5 of {mappedRows.length} contacts
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/40 px-6 py-3.5">
          {step !== 'source' ? (
            <button
              type="button"
              disabled={importing}
              onClick={() => setStep(step === 'preview' ? 'mapping' : 'source')}
              className="rounded-xl border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 disabled:opacity-50"
            >
              Cancel
            </button>

            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('preview')}
                disabled={!hasName}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                Preview Contacts
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || mappedRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>
                      Importing ({progress.current}/{progress.total})
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Import {mappedRows.length} Contacts</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
