// Assign DET-YYYY-MM-NNN invoice numbers atomically on create.
onRecordCreateRequest((e) => {
  const record = e.record
  const existing = String(record.get('invoice_number') ?? '').trim()
  if (existing && existing !== 'PENDING') {
    e.next()
    return
  }

  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = 'DET-' + y + '-' + m + '-'

  let max = 0
  try {
    const invoices = $app.findRecordsByFilter('invoices', 'invoice_number ~ "' + prefix + '%"', '-invoice_number', 200, 0)
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i]
      if (!inv) continue
      const num = String(inv.get('invoice_number') || '')
      if (!num.startsWith(prefix)) continue
      const seq = parseInt(num.slice(prefix.length), 10)
      if (!isNaN(seq) && seq > max) max = seq
    }
  } catch (err) {
    console.warn('invoice number lookup failed:', err)
  }

  const nextNum = String(max + 1).padStart(3, '0')
  record.set('invoice_number', prefix + nextNum)
  e.next()
}, 'invoices')
