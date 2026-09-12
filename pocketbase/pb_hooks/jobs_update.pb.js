// Deduct inventory when a job transitions to completed (or beyond).
// Note: app client also deducts via supplies-pocketbase.ts on complete; this hook
// covers direct API updates. Uses original() (PB 0.39+) instead of deprecated originalCopy().
onRecordUpdateRequest((e) => {
  try {
    const record = e.record
    const old = record.original()

    const completedStatuses = ['completed', 'invoiced', 'paid']
    if (completedStatuses.includes(old.get('status'))) {
      e.next()
      return
    }
    if (!completedStatuses.includes(record.get('status'))) {
      e.next()
      return
    }

    const suppliesUsed = record.get('supplies_used')
    if (!Array.isArray(suppliesUsed) || suppliesUsed.length === 0) {
      e.next()
      return
    }

    for (const usage of suppliesUsed) {
      const supplyId = usage.supply_id
      const qty = Number(usage.quantity_used ?? 0)
      if (!supplyId || qty <= 0) continue

      try {
        const supply = $app.findRecordById('supplies', supplyId)
        const onHand = Number(supply.get('quantity_on_hand') ?? 0)
        supply.set('quantity_on_hand', Math.max(0, onHand - qty))
        $app.save(supply)
      } catch (err) {
        console.warn('supply deduction failed:', supplyId, err)
      }
    }
  } catch (err) {
    console.warn('jobs_update hook skipped:', err)
  }

  e.next()
}, 'jobs')
