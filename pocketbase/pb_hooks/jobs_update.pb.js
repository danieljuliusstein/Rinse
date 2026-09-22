// Inventory bookkeeping must never catch/swallow downstream validation failures.
onRecordUpdateRequest((e) => {
  const record = e.record
  const old = record.original()
  const completed = ['completed', 'invoiced', 'paid']
  const shouldDeduct = completed.indexOf(old.getString('status')) < 0 && completed.indexOf(record.getString('status')) >= 0
  e.next()
  if (!shouldDeduct) return
  const supplies = record.get('supplies_used')
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
