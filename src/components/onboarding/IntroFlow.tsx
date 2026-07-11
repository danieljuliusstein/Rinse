import { useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AppText, PrimaryButton } from '@/src/components/ui'
import { INTRO_SLIDES, type IntroSlide } from '@/src/lib/intro-slides'
import { markSetupIntroSeen } from '@/src/lib/setup-intro'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export function IntroFlow() {
  const router = useRouter()
  const listRef = useRef<FlatList<IntroSlide>>(null)
  const [index, setIndex] = useState(0)

  const finish = async (destination: '/welcome' | '/(auth)/login' | '/(auth)/login?mode=signup') => {
    await markSetupIntroSeen()
    router.replace(destination)
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setIndex(next)
  }

  const goNext = () => {
    if (index >= INTRO_SLIDES.length - 1) {
      void finish('/(auth)/login?mode=signup')
      return
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  const renderSlide = ({ item }: { item: IntroSlide }) => {
    if (item.kind === 'hero' || item.kind === 'showcase' || item.kind === 'closing') {
      return (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.phoneFrame}>
            <Image source={item.image} style={styles.phoneImage} resizeMode="cover" />
          </View>
          {'eyebrow' in item && item.eyebrow ? (
            <AppText variant="caption" style={styles.accent}>
              {item.eyebrow}
            </AppText>
          ) : 'accent' in item ? (
            <AppText variant="caption" style={styles.accent}>
              {item.accent}
            </AppText>
          ) : null}
          <AppText variant="h1" style={styles.slideTitle}>
            {item.title}
          </AppText>
          {'body' in item && item.body ? <AppText style={styles.slideBody}>{item.body}</AppText> : null}
        </View>
      )
    }

    if (item.kind === 'checklist' || item.kind === 'timeline') {
      return (
        <View style={[styles.slide, styles.slideList, { width: SCREEN_WIDTH }]}>
          <AppText variant="caption" style={styles.accent}>
            {item.accent}
          </AppText>
          <AppText variant="h1" style={styles.slideTitle}>
            {item.title}
          </AppText>
          <View style={styles.listCard}>
            {item.items.map((row) => {
              const Icon = row.icon
              return (
                <View key={row.label} style={styles.listRow}>
                  <Icon size={20} color={colors.greenText} weight="duotone" />
                  <AppText style={styles.listLabel}>{row.label}</AppText>
                </View>
              )
            })}
          </View>
        </View>
      )
    }

    return null
  }

  const current = INTRO_SLIDES[index]
  const cta =
    current?.kind === 'hero' || current?.kind === 'closing'
      ? current.cta
      : index >= INTRO_SLIDES.length - 1
        ? 'Get started'
        : 'Continue'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => void finish('/welcome')} accessibilityRole="button">
          <AppText style={styles.skip}>Skip</AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/login')} accessibilityRole="button">
          <AppText style={styles.signIn}>Sign in</AppText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={INTRO_SLIDES}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
      />

      <View style={styles.dots}>
        {INTRO_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotOn : styles.dotOff]} />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={cta} onPress={goNext} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skip: {
    color: colors.textMuted,
    fontFamily: fonts.bodySemiBold,
  },
  signIn: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
  },
  slide: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  slideList: {
    alignItems: 'stretch',
  },
  phoneFrame: {
    width: '72%',
    aspectRatio: 0.48,
    borderRadius: radii.sheet,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  phoneImage: {
    width: '100%',
    height: '100%',
  },
  accent: {
    color: colors.greenText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    alignSelf: 'flex-start',
  },
  slideTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 30,
    alignSelf: 'flex-start',
  },
  slideBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: colors.green,
  },
  dotOff: {
    backgroundColor: colors.border,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
})
