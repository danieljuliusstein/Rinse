// Assign QTE-YYYY-MM-NNN quote numbers atomically on create.
onRecordCreateRequest((e) => {
  const record = e.record
  const existing = String(record.get('quote_number') ?? '').trim()
  if (existing && existing !== 'PENDING') {
    e.next()
    return
  }

  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = 'QTE-' + y + '-' + m + '-'

  let max = 0
  try {
    const quotes = $app.findRecordsByFilter('quotes', 'quote_number ~ "' + prefix + '%"', '-quote_number', 200, 0)
    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i]
      if (!q) continue
      const num = String(q.get('quote_number') || '')
      if (!num.startsWith(prefix)) continue
      const seq = parseInt(num.slice(prefix.length), 10)
      if (!isNaN(seq) && seq > max) max = seq
    }
  } catch (err) {
    console.warn('quote number lookup failed:', err)
  }

  const nextNum = String(max + 1).padStart(3, '0')
  record.set('quote_number', prefix + nextNum)
  e.next()
}, 'quotes')
