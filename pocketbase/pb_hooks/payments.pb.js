routerAdd('POST', '/api/rinse/reconcile-payment', (e) => {
  const data = e.requestInfo().body
  let result
  e.app.runInTransaction((tx) => {
    require(__hooks + '/pricing.js').lock(tx)
    const invoice = tx.findRecordById('invoices', data.invoiceId)
    const org = tx.findRecordById('organizations', invoice.getString('organization_id'))
    if (org.getString('stripe_connect_account_id') !== data.accountId) throw new ForbiddenError('Connected operator mismatch')
    const rows = tx.findRecordsByFilter('payment_reconciliations', 'payment_id = {:payment} && account_id = {:account}', '', 1, 0, { payment: data.paymentId, account: data.accountId })
    const row = rows.length ? rows[0] : new Record(tx.findCollectionByNameOrId('payment_reconciliations'))
    if (rows.length && row.getString('invoice_id') !== invoice.id) throw new ForbiddenError('Invoice mismatch')
    // Provider amounts are integer cents. Never roll back a refund on a delayed event.
    const amount = Number(data.amount)
    const refunded = Math.max(row.getFloat('refunded'), Number(data.refunded))
    if (!Number.isInteger(amount) || amount <= 0 || !Number.isInteger(refunded) || refunded < 0 || refunded > amount) throw new BadRequestError('Invalid payment amount')
    row.set('payment_id', data.paymentId); row.set('account_id', data.accountId); row.set('invoice_id', invoice.id)
    row.set('amount', amount); row.set('refunded', refunded); tx.save(row)
    const tipCents = Number.isInteger(Number(data.tip)) && Number(data.tip) > 0 ? Number(data.tip) : 0
    const tipDollars = tipCents / 100
    const netServiceCents = Math.max(0, amount - tipCents - refunded)
    const note = 'Stripe payment ' + data.paymentId + (tipDollars > 0 ? ' ($' + tipDollars.toFixed(2) + ' tip)' : '')
    const previous = (JSON.parse(invoice.getString('payments') || '[]') || [])
    const payments = previous.filter((p) => !p.note.startsWith('Stripe payment ' + data.paymentId))
    payments.push({ amount: netServiceCents / 100, method: 'stripe', date: new Date().toISOString().slice(0, 10), note })
    const paid = Math.round(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100
    const due = Math.max(0, Math.round((invoice.getFloat('total') - paid) * 100) / 100)
    invoice.set('payments', JSON.stringify(payments)); invoice.set('amount_paid', paid); invoice.set('balance_due', due)
    invoice.set('status', due === 0 && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'sent')
    invoice.set('paid_at', due === 0 && paid > 0 ? new Date().toISOString() : '')
    tx.save(invoice)
    const job = tx.findRecordById('jobs', invoice.getString('job_id'))
    if (tipDollars > 0) {
      const currentTip = job.getFloat('tip') || 0
      job.set('tip', Math.round((currentTip + tipDollars) * 100) / 100)
    }
    if (due === 0 && paid > 0) job.set('status', 'paid')
    else if (job.getString('status') === 'paid') job.set('status', 'invoiced')
    tx.save(job)
    result = { ok: true, tipCredited: tipDollars }
  })
  return e.json(200, result)
}, $apis.requireSuperuserAuth())
