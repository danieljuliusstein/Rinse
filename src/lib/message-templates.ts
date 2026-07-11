export interface MessageTemplateContext {
  name: string
  packageName?: string
  time?: string
  date?: string
  portalLink?: string
  reviewLink?: string
}

export function mergeTemplateBodyForContext(template: string, ctx: MessageTemplateContext): string {
  const firstName = ctx.name.trim().split(/\s+/)[0] || ctx.name.trim() || 'there'
  return template
    .replace(/\{\{name\}\}/g, firstName)
    .replace(/\{\{package\}\}/g, ctx.packageName ?? 'Detail')
    .replace(/\{\{time\}\}/g, ctx.time ?? '')
    .replace(/\{\{date\}\}/g, ctx.date ?? '')
    .replace(/\{\{portal_link\}\}/g, ctx.portalLink ?? 'https://rinsehq.com/portal')
    .replace(/\{\{review_link\}\}/g, ctx.reviewLink ?? 'https://g.page/review')
}
