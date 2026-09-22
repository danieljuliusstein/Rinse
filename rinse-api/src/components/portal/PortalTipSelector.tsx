'use client'

import { useState } from 'react'
import CurrencyAmount from '@/components/ui/CurrencyAmount'

type TipOption = 'none' | '15' | '20' | '25' | 'custom'

type Props = {
  balanceDue: number
  tipAmount: number
  onChangeTip: (amount: number) => void
}

export default function PortalTipSelector({ balanceDue, tipAmount, onChangeTip }: Props) {
  const [selectedOption, setSelectedOption] = useState<TipOption>('none')
  const [customInput, setCustomInput] = useState('')

  const handleSelect = (opt: TipOption) => {
    setSelectedOption(opt)
    if (opt === 'none') {
      onChangeTip(0)
    } else if (opt === '15') {
      onChangeTip(Math.round(balanceDue * 0.15 * 100) / 100)
    } else if (opt === '20') {
      onChangeTip(Math.round(balanceDue * 0.2 * 100) / 100)
    } else if (opt === '25') {
      onChangeTip(Math.round(balanceDue * 0.25 * 100) / 100)
    } else if (opt === 'custom') {
      const val = parseFloat(customInput) || 0
      onChangeTip(val)
    }
  }

  const handleCustomChange = (valStr: string) => {
    setCustomInput(valStr)
    const val = parseFloat(valStr) || 0
    onChangeTip(val)
  }

  const tip15 = Math.round(balanceDue * 0.15 * 100) / 100
  const tip20 = Math.round(balanceDue * 0.2 * 100) / 100
  const tip25 = Math.round(balanceDue * 0.25 * 100) / 100

  return (
    <div className="portal-tip-container" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--portal-text-primary)' }}>
          Add Gratuity / Tip
        </span>
        {tipAmount > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--portal-success-text, #166534)' }}>
            +<CurrencyAmount value={tipAmount} precision="detailed" variant="neutral" />
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 6, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => handleSelect('none')}
          className={`portal-tip-chip ${selectedOption === 'none' ? 'portal-tip-chip--active' : ''}`}
          style={{
            padding: '8px 4px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedOption === 'none' ? '2px solid var(--portal-accent, #059669)' : '1px solid var(--portal-border)',
            background: selectedOption === 'none' ? 'var(--portal-success-bg, #ecfdf5)' : 'var(--portal-surface)',
            color: selectedOption === 'none' ? 'var(--portal-accent, #059669)' : 'var(--portal-text-primary)',
          }}
        >
          No tip
        </button>

        <button
          type="button"
          onClick={() => handleSelect('15')}
          className={`portal-tip-chip ${selectedOption === '15' ? 'portal-tip-chip--active' : ''}`}
          style={{
            padding: '8px 4px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedOption === '15' ? '2px solid var(--portal-accent, #059669)' : '1px solid var(--portal-border)',
            background: selectedOption === '15' ? 'var(--portal-success-bg, #ecfdf5)' : 'var(--portal-surface)',
            color: selectedOption === '15' ? 'var(--portal-accent, #059669)' : 'var(--portal-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>15%</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>${tip15.toFixed(2)}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('20')}
          className={`portal-tip-chip ${selectedOption === '20' ? 'portal-tip-chip--active' : ''}`}
          style={{
            padding: '8px 4px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedOption === '20' ? '2px solid var(--portal-accent, #059669)' : '1px solid var(--portal-border)',
            background: selectedOption === '20' ? 'var(--portal-success-bg, #ecfdf5)' : 'var(--portal-surface)',
            color: selectedOption === '20' ? 'var(--portal-accent, #059669)' : 'var(--portal-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>20%</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>${tip20.toFixed(2)}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('25')}
          className={`portal-tip-chip ${selectedOption === '25' ? 'portal-tip-chip--active' : ''}`}
          style={{
            padding: '8px 4px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedOption === '25' ? '2px solid var(--portal-accent, #059669)' : '1px solid var(--portal-border)',
            background: selectedOption === '25' ? 'var(--portal-success-bg, #ecfdf5)' : 'var(--portal-surface)',
            color: selectedOption === '25' ? 'var(--portal-accent, #059669)' : 'var(--portal-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>25%</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>${tip25.toFixed(2)}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('custom')}
          className={`portal-tip-chip ${selectedOption === 'custom' ? 'portal-tip-chip--active' : ''}`}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedOption === 'custom' ? '2px solid var(--portal-accent, #059669)' : '1px solid var(--portal-border)',
            background: selectedOption === 'custom' ? 'var(--portal-success-bg, #ecfdf5)' : 'var(--portal-surface)',
            color: selectedOption === 'custom' ? 'var(--portal-accent, #059669)' : 'var(--portal-text-primary)',
          }}
        >
          Custom
        </button>
      </div>

      {selectedOption === 'custom' && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--portal-text-muted)' }}>$</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0.00"
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--portal-border)',
              background: 'var(--portal-surface)',
              color: 'var(--portal-text-primary)',
              fontSize: 13,
              width: 120,
            }}
          />
        </div>
      )}
    </div>
  )
}
