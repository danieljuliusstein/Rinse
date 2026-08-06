import carTopView from '@/assets/car-top-view.png'
import { CAR_MAP_PINS, OFF_MAP_AREAS } from '@/lib/car-map-pins'
import { colors } from '@/theme/colors'

type Props = {
  selectedArea: string | null
  onSelectArea: (area: string | null) => void
  markedAreas?: string[]
}

const DOT = 14
const HIT = 36

/**
 * Read-only web port of mobile `CarDamageMap` — tap pins / off-map chips to filter.
 * Calibration stays on mobile; Desk uses shipped default pin positions.
 */
export function CarDamageMap({ selectedArea, onSelectArea, markedAreas = [] }: Props) {
  const marked = new Set(markedAreas)
  const onMap = CAR_MAP_PINS.some((p) => p.id === selectedArea)
  const offMapChips = [...OFF_MAP_AREAS]

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 text-center font-medium">
        Tap a dot on the car
      </p>

      <div
        className="relative w-full max-w-[300px] aspect-[3/4] rounded-xl overflow-hidden bg-white border border-gray-100"
        role="img"
        aria-label="Car body map"
      >
        <img
          src={carTopView}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {CAR_MAP_PINS.map((pin) => {
          const selected = selectedArea === pin.id
          const hasExisting = marked.has(pin.id)
          const active = selected || hasExisting
          return (
            <button
              key={pin.id}
              type="button"
              title={pin.id}
              aria-label={pin.id}
              aria-pressed={selected}
              onClick={() => onSelectArea(selected ? null : pin.id)}
              className="absolute flex items-center justify-center"
              style={{
                left: `${pin.left}%`,
                top: `${pin.top}%`,
                width: HIT,
                height: HIT,
                marginLeft: -HIT / 2,
                marginTop: -HIT / 2,
                zIndex: selected ? 2 : 1,
              }}
            >
              <span
                className="block rounded-full shadow-sm"
                style={{
                  width: selected ? 18 : DOT,
                  height: selected ? 18 : DOT,
                  background: active ? colors.amber : colors.surface,
                  border: active ? '2px solid #fff' : `3px solid ${colors.green}`,
                  boxSizing: 'border-box',
                }}
              />
            </button>
          )
        })}
      </div>

      {selectedArea && onMap ? (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold max-w-full"
          style={{
            background: colors.greenSoft,
            color: colors.greenText,
            border: `1px solid ${colors.greenBorder}`,
          }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.amber }} />
          <span className="truncate">{selectedArea}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-1.5">
        {offMapChips.map((area) => {
          const selected = selectedArea === area
          const hasExisting = marked.has(area)
          return (
            <button
              key={area}
              type="button"
              onClick={() => onSelectArea(selected ? null : area)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                selected
                  ? 'bg-gray-900 text-white border-gray-900'
                  : hasExisting
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-500'
              }`}
            >
              {area}
            </button>
          )
        })}
        {selectedArea ? (
          <button
            type="button"
            onClick={() => onSelectArea(null)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}
