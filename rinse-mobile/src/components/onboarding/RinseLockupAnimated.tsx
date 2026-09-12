import { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path } from 'react-native-svg'
import type { ComponentProps } from 'react'
import { useReduceMotion } from '@/src/hooks/useReduceMotion'

/** Animated injects RN view props (e.g. collapsable); strip them on web before SVG DOM. */
function withoutRnViewProps<T extends Record<string, unknown>>(props: T): T {
  if (Platform.OS !== 'web') return props
  const { collapsable: _collapsable, collapsible: _collapsible, ...rest } = props
  return rest as T
}

function SvgPath(props: ComponentProps<typeof Path> & Record<string, unknown>) {
  return <Path {...withoutRnViewProps(props)} />
}

function SvgCircle(props: ComponentProps<typeof Circle> & Record<string, unknown>) {
  return <Circle {...withoutRnViewProps(props)} />
}

function SvgG(props: ComponentProps<typeof G> & Record<string, unknown>) {
  return <G {...withoutRnViewProps(props)} />
}

const AnimatedPath = Animated.createAnimatedComponent(SvgPath)
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle)
const AnimatedG = Animated.createAnimatedComponent(SvgG)

/** Approximate length of the S-curve icon path (viewBox units). */
const ICON_PATH_LENGTH = 150

const ICON_PATH = 'M 22,26 L 55,26 C 72,26 72,48 55,48 L 32,48 C 15,48 15,70 32,70 L 48,70'

const WORDMARK_PATH =
  'M 42.00,0.00 L 27.41,26.50 L 23.30,26.50 L 23.30,0.00 L 6.20,0.00 L 6.20,70.20 L 34.91,70.20 Q 43.20,70.20 49.05,67.30 Q 54.91,64.41 57.80,59.34 Q 60.70,54.30 60.70,48.09 Q 60.70,41.09 56.75,35.59 Q 52.80,30.09 45.09,27.80 L 61.30,0.00 L 42.00,0.00 Z M 23.30,38.59 L 33.91,38.59 Q 38.59,38.59 40.94,40.89 Q 43.30,43.20 43.30,47.41 Q 43.30,51.41 40.94,53.70 Q 38.59,56.00 33.91,56.00 L 23.30,56.00 L 23.30,38.59 Z M 80.00,61.59 Q 75.50,61.59 72.64,64.25 Q 69.79,66.91 69.79,70.80 Q 69.79,74.80 72.64,77.44 Q 75.50,80.09 80.00,80.09 Q 84.40,80.09 87.25,77.44 Q 90.11,74.80 90.11,70.80 Q 90.11,66.91 87.25,64.25 Q 84.40,61.59 80.00,61.59 Z M 88.50,55.80 L 88.50,0.00 L 71.40,0.00 L 71.40,55.80 L 88.50,55.80 Z M 134.90,56.41 Q 144.70,56.41 150.54,50.05 Q 156.40,43.70 156.40,32.59 L 156.40,0.00 L 139.40,0.00 L 139.40,30.30 Q 139.40,35.91 136.50,39.00 Q 133.61,42.09 128.70,42.09 Q 123.79,42.09 120.89,39.00 Q 118.00,35.91 118.00,30.30 L 118.00,0.00 L 100.90,0.00 L 100.90,55.80 L 118.00,55.80 L 118.00,48.41 Q 120.61,52.09 125.00,54.25 Q 129.40,56.41 134.90,56.41 Z M 191.01,-0.80 Q 183.69,-0.80 177.99,1.70 Q 172.30,4.20 168.99,8.55 Q 165.69,12.91 165.30,18.30 L 182.19,18.30 Q 182.51,15.41 184.90,13.59 Q 187.30,11.80 190.80,11.80 Q 194.01,11.80 195.76,13.05 Q 197.51,14.30 197.51,16.30 Q 197.51,18.70 195.01,19.84 Q 192.51,21.00 186.90,22.41 Q 180.90,23.80 176.90,25.34 Q 172.90,26.91 169.99,30.25 Q 167.10,33.59 167.10,39.30 Q 167.10,44.09 169.74,48.05 Q 172.40,52.00 177.54,54.30 Q 182.69,56.59 189.80,56.59 Q 200.30,56.59 206.35,51.39 Q 212.40,46.20 213.30,37.59 L 197.51,37.59 Q 197.10,40.50 194.94,42.20 Q 192.80,43.91 189.30,43.91 Q 186.30,43.91 184.69,42.75 Q 183.10,41.59 183.10,39.59 Q 183.10,37.20 185.65,36.00 Q 188.19,34.80 193.60,33.59 Q 199.80,32.00 203.69,30.45 Q 207.60,28.91 210.55,25.45 Q 213.51,22.00 213.60,16.20 Q 213.60,11.30 210.85,7.44 Q 208.10,3.59 202.94,1.39 Q 197.80,-0.80 191.01,-0.80 Z M 276.70,28.80 Q 276.70,26.41 276.40,23.80 L 237.70,23.80 Q 238.10,18.59 241.04,15.84 Q 243.99,13.09 248.31,13.09 Q 254.70,13.09 257.20,18.50 L 275.40,18.50 Q 273.99,13.00 270.34,8.59 Q 266.70,4.20 261.20,1.70 Q 255.70,-0.80 248.90,-0.80 Q 240.70,-0.80 234.29,2.70 Q 227.90,6.20 224.29,12.70 Q 220.70,19.20 220.70,27.91 Q 220.70,36.59 224.24,43.09 Q 227.81,49.59 234.20,53.09 Q 240.60,56.59 248.90,56.59 Q 256.99,56.59 263.29,53.19 Q 269.60,49.80 273.15,43.50 Q 276.70,37.20 276.70,28.80 Z M 259.20,33.30 Q 259.20,37.70 256.20,40.30 Q 253.20,42.91 248.70,42.91 Q 244.40,42.91 241.45,40.41 Q 238.49,37.91 237.81,33.30 L 259.20,33.30 Z'

const VIEW_W = 397.83
const VIEW_H = 100.9
const ASPECT = VIEW_W / VIEW_H

const drawEase = Easing.bezier(0.76, 0, 0.24, 1)
const riseEase = Easing.bezier(0.16, 1, 0.3, 1)

/**
 * Animated Rinse lockup from design/Figma Make:
 * S-curve stroke draw → terminal dot pop → wordmark rise.
 * Use on auth/welcome brand moments — not for dense list chrome.
 */
export function RinseLockupAnimated({
  height = 36,
  onDark = false,
}: {
  height?: number
  onDark?: boolean
}) {
  const reduceMotion = useReduceMotion()
  const width = Math.round(height * ASPECT)
  const wordmarkFill = onDark ? '#ffffff' : '#0A0E1A'

  const dashOffset = useRef(new Animated.Value(ICON_PATH_LENGTH)).current
  const dotScale = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduceMotion) {
      dashOffset.setValue(0)
      dotScale.setValue(1)
      textOpacity.setValue(1)
      return
    }

    dashOffset.setValue(ICON_PATH_LENGTH)
    dotScale.setValue(0)
    textOpacity.setValue(0)

    Animated.parallel([
      Animated.timing(dashOffset, {
        toValue: 0,
        duration: 1100,
        easing: drawEase,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.sequence([
          Animated.timing(dotScale, {
            toValue: 1.35,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(dotScale, {
            toValue: 0.88,
            duration: 90,
            useNativeDriver: false,
          }),
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1150),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: riseEase,
          useNativeDriver: false,
        }),
      ]),
    ]).start()
  }, [dashOffset, dotScale, reduceMotion, textOpacity])

  const dotR = dotScale.interpolate({
    inputRange: [0, 1.35],
    outputRange: [0, 7 * 1.35],
  })

  return (
    <View style={[styles.wrap, { width, height }]} accessibilityLabel="Rinse">
      <Svg width={width} height={height} viewBox={`-10 -10 ${VIEW_W} ${VIEW_H}`}>
        <G transform="scale(1.431858) translate(-13.7,-20.5)">
          <AnimatedPath
            d={ICON_PATH}
            fill="none"
            stroke="#22c55e"
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${ICON_PATH_LENGTH},${ICON_PATH_LENGTH}`}
            strokeDashoffset={dashOffset}
          />
          <AnimatedCircle cx={66} cy={70} r={dotR} fill="#22c55e" />
        </G>

        {/*
          Do not pass `translateY` to SVG G — on web it becomes an invalid DOM attr.
          Wordmark rises via opacity only (draw + fade still read as a brand moment).
        */}
        <AnimatedG opacity={textOpacity}>
          <G transform="translate(101.136,80.0938) scale(1,-1)">
            <Path d={WORDMARK_PATH} fill={wordmarkFill} />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
  },
})
