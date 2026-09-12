import { useCallback, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check } from '@/src/icons'
import { useFocusEffect } from 'expo-router'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, Card, ListRow, ScreenLoading } from '@/src/components/ui'
import {
  APP_LOCALES,
  deviceAppLocale,
  getAppLocale,
  localeDisplayName,
  setAppLocale,
  type AppLocale,
} from '@/src/i18n'
import { colors, spacing } from '@/src/theme/colors'

export default function SettingsLanguageScreen() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locale, setLocale] = useState<AppLocale>(getAppLocale())
  const [query, setQuery] = useState('')

  useFocusEffect(
    useCallback(() => {
      setLocale(getAppLocale())
      setLoading(false)
    }, [i18n.language]),
  )

  const onChange = async (next: AppLocale) => {
    if (next === locale) return
    setLocale(next)
    setSaving(true)
    try {
      await setAppLocale(next)
      Alert.alert(t('language.saved'))
    } catch (e) {
      Alert.alert(t('language.saveFailed'), e instanceof Error ? e.message : undefined)
      setLocale(getAppLocale())
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return APP_LOCALES
    return APP_LOCALES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.englishLabel.toLowerCase().includes(q) ||
        l.value.includes(q),
    )
  }, [query])

  if (loading) {
    return (
      <SettingsScreen title={t('language.title')}>
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  const device = deviceAppLocale()

  return (
    <SettingsScreen title={t('language.title')} subtitle={t('language.subtitle')}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="sectionLabel">{t('language.sectionApp')}</AppText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('language.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />

        <AppText variant="caption" style={styles.hint}>
          {t('language.deviceDefault', { lang: localeDisplayName(device) })}
        </AppText>

        <View style={styles.list}>
          {filtered.map((l, index) => {
            const selected = l.value === locale
            return (
              <ListRow
                key={l.value}
                title={l.label}
                subtitle={l.englishLabel}
                grouped
                isLast={index === filtered.length - 1}
                showChevron={false}
                trailing={
                  selected ? <Check size={20} color={colors.green} weight="bold" /> : undefined
                }
                onPress={() => void onChange(l.value)}
              />
            )
          })}
        </View>

        <Card style={styles.card}>
          <AppText variant="bodySemiBold">{t('language.sectionDocs')}</AppText>
          <AppText variant="caption" style={styles.hint}>
            {t('language.docsHint')}
          </AppText>
        </Card>

        {saving ? (
          <AppText variant="caption" style={styles.hint}>
            {t('common.saving')}
          </AppText>
        ) : null}
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  hint: {
    color: colors.textMuted,
    lineHeight: 18,
  },
  list: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
})
