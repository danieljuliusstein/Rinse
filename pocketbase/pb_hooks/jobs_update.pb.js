// Inventory bookkeeping must never catch/swallow downstream validation failures.
onRecordUpdateRequest((e) => {
  const record = e.record
  const old = record.original()
  const completed = ['completed', 'invoiced', 'paid']
  const shouldDeduct = completed.indexOf(old.getString('status')) < 0 && completed.indexOf(record.getString('status')) >= 0
  e.next()
  if (!shouldDeduct) return
  // record.get() on a JSON field returns the raw JSON bytes (an array-like
  // of byte codes, not a parsed value) in this PB 0.39 JSVM — Array.isArray()
  // on it is true, but iterating it yields byte values, not the usage
  // objects. String(...) converts it to the JSON text, so it must be
  // explicitly parsed.
  let supplies
  try {
    supplies = JSON.parse(String(record.get('supplies_used') || '[]'))
  } catch (err) {
    supplies = []
  }
  if (!Array.isArray(supplies)) return
  for (const usage of supplies) {
    if (!usage.supply_id || !(Number(usage.quantity_used) > 0)) continue
    try {
      const supply = e.app.findRecordById('supplies', usage.supply_id)
      supply.set('quantity_on_hand', Math.max(0, supply.getFloat('quantity_on_hand') - Number(usage.quantity_used)))
      e.app.save(supply)
    } catch (err) { console.warn('supply deduction failed:', usage.supply_id, err) }
  }
}, 'jobs')
