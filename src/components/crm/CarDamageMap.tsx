import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PanResponderGestureState,
} from 'react-native'
import { AppText } from '@/src/components/ui/AppText'
import { selectionHaptic } from '@/src/lib/haptics'
import {
  CAR_MAP_AREAS,
  CAR_MAP_PINS,
  OFF_MAP_AREAS,
  type CarMapArea,
  type CarMapPin,
} from '@/src/lib/car-map-pins'
import {
  clearSavedCarMapPins,
  loadSavedCarMapPins,
  saveCarMapPins,
} from '@/src/lib/car-map-pins-storage'
import { colors, layout, radii, spacing, webInlinePressableReset } from '@/src/theme/colors'

export type { CarMapArea, CarMapPin }
export { CAR_MAP_AREAS, CAR_MAP_PINS, OFF_MAP_AREAS }

const carTopView = require('../../../assets/images/car-top-view.png')

function roundCoord(n: number): number {
  return Math.round(n * 10) / 10
}

type CarDamageMapProps = {
  selectedArea: string | null
  onSelectArea: (area: string) => void
  markedAreas?: string[]
  onCalibrateChange?: (active: boolean) => void
}

export function CarDamageMap({
  selectedArea,
  onSelectArea,
  markedAreas = [],
  onCalibrateChange,
}: CarDamageMapProps) {
  const marked = new Set(markedAreas)
  const [calibrate, setCalibrate] = useState(false)
  const [pins, setPins] = useState<CarMapPin[]>(() => CAR_MAP_PINS.map((p) => ({ ...p })))
  const [pinsReady, setPinsReady] = useState(false)
  const [savingPins, setSavingPins] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tapProbe, setTapProbe] = useState<{ left: number; top: number } | null>(null)
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 })
  const mapSize = useRef({ w: 0, h: 0 })
  const dragStart = useRef({ left: 0, top: 0 })
  const dragIdRef = useRef<string | null>(null)
  const pinsRef = useRef(pins)
  const calibrateRef = useRef(calibrate)
  pinsRef.current = pins
  calibrateRef.current = calibrate

  useEffect(() => {
    let cancelled = false
    void loadSavedCarMapPins().then((loaded) => {
      if (cancelled) return
      setPins(loaded)
      setPinsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onMap = pins.some((p) => p.id === selectedArea)
  const activePin = pins.find((p) => p.id === (calibrate ? activeId : selectedArea))

  const onMapLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    mapSize.current = { w: width, h: height }
    setMapLayout((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    )
  }, [])

  const movePin = useCallback((id: string, left: number, top: number) => {
    setPins((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              left: roundCoord(Math.min(98, Math.max(2, left))),
              top: roundCoord(Math.min(98, Math.max(2, top))),
            }
          : p,
      ),
    )
  }, [])

  const hitTestPin = useCallback((locationX: number, locationY: number): CarMapPin | null => {
    const { w, h } = mapSize.current
    if (!w || !h) return null
    const xPct = (locationX / w) * 100
    const yPct = (locationY / h) * 100
    const radius = (layout.minTapTarget / Math.min(w, h)) * 100 * 0.65
    let best: CarMapPin | null = null
    let bestDist = radius
    for (const pin of pinsRef.current) {
      const d = Math.hypot(pin.left - xPct, pin.top - yPct)
      if (d <= bestDist) {
        bestDist = d
        best = pin
      }
    }
    return best
  }, [])

  const mapPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => calibrateRef.current,
        onStartShouldSetPanResponderCapture: () => calibrateRef.current,
        onMoveShouldSetPanResponder: () => calibrateRef.current && dragIdRef.current != null,
        onMoveShouldSetPanResponderCapture: () => calibrateRef.current && dragIdRef.current != null,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e) => {
          if (!calibrateRef.current) return
          const { locationX, locationY } = e.nativeEvent
          const hit = hitTestPin(locationX, locationY)
          if (hit) {
            dragIdRef.current = hit.id
            dragStart.current = { left: hit.left, top: hit.top }
            setActiveId(hit.id)
            setTapProbe(null)
            selectionHaptic()
          } else {
            dragIdRef.current = null
            const { w, h } = mapSize.current
            if (w && h) {
              setTapProbe({
                left: roundCoord((locationX / w) * 100),
                top: roundCoord((locationY / h) * 100),
              })
            }
            setActiveId(null)
          }
        },
        onPanResponderMove: (_e, g: PanResponderGestureState) => {
          const id = dragIdRef.current
          if (!id) return
          const { w, h } = mapSize.current
          if (!w || !h) return
          movePin(id, dragStart.current.left + (g.dx / w) * 100, dragStart.current.top + (g.dy / h) * 100)
        },
        onPanResponderRelease: () => {
          dragIdRef.current = null
          setActiveId(null)
        },
        onPanResponderTerminate: () => {
          dragIdRef.current = null
          setActiveId(null)
        },
      }),
    [hitTestPin, movePin],
  )

  const setCalibrateMode = useCallback(
    (next: boolean) => {
      setCalibrate(next)
      onCalibrateChange?.(next)
      setTapProbe(null)
      setActiveId(null)
      dragIdRef.current = null
    },
    [onCalibrateChange],
  )

  const persistPins = async () => {
    setSavingPins(true)
    try {
      await saveCarMapPins(pins)
      selectionHaptic()
      Alert.alert('Pins saved', 'These positions will be used next time you open Add damage.')
      setCalibrateMode(false)
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save pin positions.')
    } finally {
      setSavingPins(false)
    }
  }

  const resetPins = async () => {
    await clearSavedCarMapPins()
    setPins(CAR_MAP_PINS.map((p) => ({ ...p })))
    setTapProbe(null)
    setActiveId(null)
    dragIdRef.current = null
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" style={styles.hint}>
        {calibrate ? 'Drag dots into place · tap empty area for %' : 'Tap a dot on the car'}
      </AppText>

      <View
        style={[styles.mapCard, calibrate ? styles.mapCardCalibrate : null]}
        onLayout={onMapLayout}
        {...(calibrate ? mapPan.panHandlers : {})}
      >
        {mapLayout.width > 0 ? (
          <Image
            source={carTopView}
            style={[
              styles.carImage,
              { width: mapLayout.width, height: mapLayout.height },
              !pinsReady ? styles.carImageLoading : null,
            ]}
            resizeMode="contain"
            accessibilityLabel="Car body map"
            pointerEvents="none"
          />
        ) : null}

        {calibrate && tapProbe ? (
          <View
            pointerEvents="none"
            style={[
              styles.probe,
              {
                left: `${tapProbe.left}%`,
                top: `${tapProbe.top}%`,
                marginLeft: -4,
                marginTop: -4,
              },
            ]}
          />
        ) : null}

        {pins.map((pin) => {
          const selected = !calibrate && selectedArea === pin.id
          const hasExisting = marked.has(pin.id)
          const dragging = calibrate && activeId === pin.id

          return (
            <View
              key={pin.id}
              pointerEvents={calibrate ? 'none' : 'box-none'}
              style={[
                styles.pinHit,
                {
                  left: `${pin.left}%`,
                  top: `${pin.top}%`,
                  marginLeft: -layout.minTapTarget / 2,
                  marginTop: -layout.minTapTarget / 2,
                  zIndex: dragging ? 20 : 1,
                },
              ]}
            >
              {calibrate ? (
                <View style={[styles.dot, styles.dotCalibrate, dragging ? styles.dotSelected : null]} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={pin.id}
                  accessibilityState={{ selected }}
                  hitSlop={4}
                  onPress={() => {
                    selectionHaptic()
                    onSelectArea(pin.id)
                  }}
                  style={[styles.pinPress, webInlinePressableReset]}
                >
                  <View
                    style={[
                      styles.dot,
                      hasExisting && !selected ? styles.dotMarked : null,
                      selected ? styles.dotSelected : null,
                    ]}
                  />
                </Pressable>
              )}
            </View>
          )
        })}
      </View>

      {calibrate && activePin ? (
        <AppText variant="caption" style={styles.coordReadout}>
          {activePin.id}: left {activePin.left}% · top {activePin.top}%
        </AppText>
      ) : null}

      {calibrate && tapProbe && !activePin ? (
        <AppText variant="caption" style={styles.coordReadout}>
          Tap probe: left {tapProbe.left}% · top {tapProbe.top}%
        </AppText>
      ) : null}

      {!calibrate && selectedArea && onMap ? (
        <View style={styles.selectedChip}>
          <View style={styles.selectedDot} />
          <AppText variant="bodySemiBold" style={styles.selectedLabel}>
            {selectedArea}
          </AppText>
        </View>
      ) : null}

      <View style={styles.calibrateRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCalibrateMode(!calibrate)}
          style={[styles.calibrateBtn, webInlinePressableReset, calibrate ? styles.calibrateBtnOn : null]}
        >
          <AppText variant="caption" style={calibrate ? styles.calibrateLabelOn : styles.calibrateLabel}>
            {calibrate ? 'Cancel calibrate' : 'Calibrate pins'}
          </AppText>
        </Pressable>

        {calibrate ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={savingPins}
              onPress={() => void persistPins()}
              style={[styles.calibrateBtn, webInlinePressableReset, styles.calibrateBtnPrimary]}
            >
              <AppText variant="caption" style={styles.calibrateLabelPrimary}>
                {savingPins ? 'Saving…' : 'Save positions'}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void resetPins()}
              style={[styles.calibrateBtn, webInlinePressableReset]}
            >
              <AppText variant="caption" style={styles.calibrateLabel}>
                Reset to default
              </AppText>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  )
}

const DOT = 14

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  mapCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapCardCalibrate:
    Platform.OS === 'web'
      ? ({
          touchAction: 'none',
        } as object)
      : {},
  carImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  carImageLoading: {
    opacity: 0.85,
  },
  pinHit: {
    position: 'absolute',
    width: layout.minTapTarget,
    height: layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPress: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  probe: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 5,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.green,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  dotCalibrate: {
    borderColor: colors.blue,
  },
  dotSelected: {
    backgroundColor: colors.green,
    borderColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
  },
  dotMarked: {
    backgroundColor: colors.amber,
    borderColor: '#fff',
  },
  coordReadout: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  selectedChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  selectedLabel: {
    color: colors.greenText,
    fontSize: 13,
    flexShrink: 1,
  },
  calibrateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  calibrateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  calibrateBtnOn: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  calibrateBtnPrimary: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder,
  },
  calibrateLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  calibrateLabelOn: {
    color: colors.blue,
    fontSize: 11,
  },
  calibrateLabelPrimary: {
    color: colors.greenText,
    fontSize: 11,
  },
})
