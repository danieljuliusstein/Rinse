import { useCallback, useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, Card } from '@/src/components/ui'
import { APP_DISPLAY_NAME, SUPPORT_FAQ } from '@/src/lib/support-config'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsFaqScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>()
  const scrollRef = useRef<ScrollView>(null)
  const offsetsRef = useRef<Record<string, number>>({})

  const scrollToFocus = useCallback(() => {
    if (!focus || typeof focus !== 'string') return
    const y = offsetsRef.current[focus]
    if (y == null) return
    scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true })
  }, [focus])

  useEffect(() => {
    const timer = setTimeout(scrollToFocus, 120)
    return () => clearTimeout(timer)
  }, [scrollToFocus])

  return (
    <SettingsScreen title="FAQ" fallbackHref="/settings/support">
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" style={styles.lead}>
          Quick answers for {APP_DISPLAY_NAME} operators
        </AppText>

        <Card style={styles.card}>
          <View>
            {SUPPORT_FAQ.map((item, index) => {
            const highlighted = focus === item.id
            return (
              <View
                key={item.id}
                onLayout={(e) => {
                  offsetsRef.current[item.id] = e.nativeEvent.layout.y
                  if (focus === item.id) scrollToFocus()
                }}
                style={[
                  styles.section,
                  index < SUPPORT_FAQ.length - 1 ? styles.sectionBorder : null,
                  highlighted ? styles.sectionHighlight : null,
                ]}
              >
                <AppText variant="bodySemiBold" style={styles.question}>
                  {item.question}
                </AppText>
                <AppText variant="body" style={styles.answer}>
                  {item.answer}
                </AppText>
              </View>
            )
            })}
          </View>
        </Card>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  card: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
  },
  section: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionHighlight: {
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  question: {
    fontSize: 15,
    lineHeight: 21,
  },
  answer: {
    color: colors.textSecondary,
    lineHeight: 21,
    fontSize: 14,
  },
})
