/** Structured security audit events (Wave 7) — Vercel/Fly function logs. */

export type AuditEventType = 'auth_failure' | 'admin_backup_triggered' | 'webhook_reject'

export function logAuditEvent(type: AuditEventType, details: Record<string, unknown>): void {
  console.info(
    JSON.stringify({
      event: type,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  )
}
