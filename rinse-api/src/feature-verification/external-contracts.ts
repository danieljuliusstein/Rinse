export type StripeCheckoutPayload = { invoiceId: string; amount: number; currency: string }
export type EmailPayload = { to: string; subject: string; html: string }

export class MockStripe {
  readonly checkoutCalls: StripeCheckoutPayload[] = []
  private readonly processedEvents = new Set<string>()

  async createCheckoutSession(payload: StripeCheckoutPayload): Promise<{ id: string; url: string }> {
    this.checkoutCalls.push(payload)
    return { id: `cs_test_${this.checkoutCalls.length}`, url: `https://checkout.test/${payload.invoiceId}` }
  }

  processWebhook(eventId: string): boolean {
    if (this.processedEvents.has(eventId)) return false
    this.processedEvents.add(eventId)
    return true
  }
}

export class MockEmailProvider {
  readonly sent: EmailPayload[] = []

  async send(payload: EmailPayload): Promise<{ id: string }> {
    this.sent.push(payload)
    return { id: `email_test_${this.sent.length}` }
  }
}

export class MockPdfRenderer {
  async renderInvoice(input: { invoiceNumber: string; total: number }): Promise<Uint8Array> {
    return new TextEncoder().encode(`Invoice ${input.invoiceNumber}\nTotal ${input.total.toFixed(2)}`)
  }
}
