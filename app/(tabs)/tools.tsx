import { ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Globe } from 'phosphor-react-native'
import { OperatorScreen, useTabDockPadding } from '@/src/components/OperatorScreen'
import { WebsiteWidgetCard } from '@/src/components/tools/WebsiteWidgetCard'
import { AppText, ListRow, SectionGroup } from '@/src/components/ui'
import { SettingsHeader } from '@/src/components/ui/BackHeaderButton'
import { useSafeBack } from '@/src/lib/safe-go-back'
import { TOOLS_MENU_ITEMS } from '@/src/lib/tools-menu'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

export default function ToolsScreen() {
  const router = useRouter()
  const goBack = useSafeBack()
  const dockPadding = useTabDockPadding()

  const navigate = (href: string) => {
    router.push(href as never)
  }

  return (
    <OperatorScreen
      customHeader={
        <SettingsHeader title="Tools" onBack={goBack} />
      }
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: dockPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <WebsiteWidgetCard />
        <SectionGroup title="Operations">
          {TOOLS_MENU_ITEMS.map((item) => {
            const Icon = item.Icon
            const tone = iconTonePalette[item.tone]
            return (
              <ListRow
                key={item.id}
                icon={<Icon size={20} color={tone.fg} weight="duotone" />}
                iconTone={item.tone}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() => navigate(item.href)}
              />
            )
          })}
        </SectionGroup>
        <View style={styles.footer}>
          <Globe size={18} color={colors.textMuted} weight="duotone" />
          <AppText variant="caption" style={styles.footerText}>
            Add the booking widget to your website — clients schedule without leaving your brand.
          </AppText>
        </View>
      </ScrollView>
    </OperatorScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  footerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
})
