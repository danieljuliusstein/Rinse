export function isPlatformAdminEmail(email: string): boolean {
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.trim().toLowerCase())
}
