import { Platform, Share } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import type { Client, JobWithRelations } from '@rinse/core'
import { fmt } from '@rinse/core'
import { appApiFetch } from './app-api'
import { requireOrganizationId } from './org'
import { arrayBufferToBase64 } from './share'
import { checkPremiumGate } from './subscription'
import { downloadPdfOnWeb, downloadTextOnWeb } from './web-download'
import type { PLReport } from './reports'

export async function shareTextExport(filename: string, content: string, mimeType = 'text/plain'): Promise<void> {
  if (Platform.OS === 'web') {
    downloadTextOnWeb(filename, content, mimeType)
    return
  }

  const path = `${FileSystem.cacheDirectory}${filename}`
  await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType, dialogTitle: filename })
    return
  }
  await Share.share({ message: content, title: filename })
}

export function formatClientsCsv(clients: Client[]): string {
  const header = 'name,phone,email,address,notes'
  const rows = clients.map((c) =>
    [c.name, c.phone ?? '', c.email ?? '', c.address ?? '', c.notes ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  return [header, ...rows].join('\n')
}

export function formatJobsReportCsv(jobs: JobWithRelations[], report: PLReport, rangeLabel: string): string {
  const lines = [
    `Rinse report — ${rangeLabel}`,
    `Revenue,${report.revenue}`,
    `Expenses,${report.totalExpenses}`,
    `Net profit,${report.netProfit}`,
    `Margin,${report.marginPct}%`,
    `Jobs,${report.jobCount}`,
    '',
    'Expense breakdown',
    `Supplies,${report.expenses.supplies}`,
    `Travel,${report.expenses.travel}`,
    `Equipment,${report.expenses.equipment}`,
    `Marketing,${report.expenses.marketing}`,
    `Labor,${report.expenses.labor}`,
    `Overhead,${report.expenses.overhead}`,
    `Business,${report.expenses.business}`,
    `Other,${report.expenses.other}`,
    '',
    'Jobs',
    'date,client,package,revenue,tip,status',
  ]
  for (const job of jobs) {
    lines.push(
      [
        job.date,
        job.client?.name ?? '',
        job.package?.name ?? '',
        job.revenue,
        job.tip,
        job.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
  }
  return lines.join('\n')
}

export async function triggerServerBackup(): Promise<{ ok: boolean; error?: string }> {
  try {
    const orgId = requireOrganizationId()
    const res = await appApiFetch(
      `/api/backups/trigger?organizationId=${encodeURIComponent(orgId)}`,
      { method: 'POST' }
    )
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: data.error ?? `Backup failed (${res.status})` }
    }
    const backup = (await res.json()) as { exported_at?: string }
    const exportedAt = backup.exported_at ?? new Date().toISOString()
    await shareTextExport(
      `detailing-backup-${exportedAt.slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      'application/json'
    )
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Backup failed' }
  }
}

export async function exportBusinessJson(data: Record<string, unknown>): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  await shareTextExport(`rinse-backup-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json')
}

export async function shareReportPdf(range: string): Promise<void> {
  const gate = await checkPremiumGate('export_pdf')
  if (!gate.allowed) {
    throw new Error('Active subscription required')
  }

  const res = await appApiFetch('/api/pdf/report', {
    method: 'POST',
    body: JSON.stringify({ range }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? `PDF export failed (${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const filename = `report-${range}-${new Date().toISOString().slice(0, 10)}.pdf`

  if (Platform.OS === 'web') {
    downloadPdfOnWeb(filename, arrayBuffer)
    return
  }

  const base64 = arrayBufferToBase64(arrayBuffer)
  const path = `${FileSystem.cacheDirectory}${filename}`
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: `Report ${range}` })
    return
  }

  await Share.share({ url: path, title: filename })
}

export function formatMoneyLine(label: string, amount: number): string {
  return `${label}: ${fmt(amount)}`
}
