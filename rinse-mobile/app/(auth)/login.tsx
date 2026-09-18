import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { RinseLockupAnimated } from '@/src/components/onboarding/RinseLogo'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { AppText } from '@/src/components/ui/AppText'
import { isOAuthCancelled, requestPasswordReset } from '@/src/lib/auth'
import { markTourPending } from '@/src/lib/product-tour'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type AuthMode = 'login' | 'signup' | 'forgot'

function slugifyBusinessName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ mode?: string }>()
  const { signIn, signUp, signInOAuth, configured, backendHealthy } = useAuth()

  const initialMode: AuthMode = params.mode === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState(process.env.EXPO_PUBLIC_TEST_EMAIL ?? '')
  const [password, setPassword] = useState(process.env.EXPO_PUBLIC_TEST_PASSWORD ?? '')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (params.mode === 'signup') setMode('signup')
  }, [params.mode])

  const slugPreview = useMemo(() => slugifyBusinessName(businessName), [businessName])

  const title =
    mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'
  const subtitle =
    mode === 'login'
      ? 'Sign in to your jobs, clients, and business data'
      : mode === 'signup'
        ? 'Your solo mobile detailing workspace'
        : 'Enter your email and we will send a reset link'

  const onSubmit = async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const result = await requestPasswordReset(email)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setInfo(`If an account exists for ${email.trim()}, a reset link is on its way.`)
        return
      }

      if (mode === 'signup') {
        if (!businessName.trim()) {
          setError('Business name is required')
          return
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters')
          return
        }
        await signUp({ email, password, businessName: businessName.trim() })
        await markTourPending()
        return
      }

      await signIn(email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  const onOAuth = async (provider: 'google' | 'apple') => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await signInOAuth(provider)
    } catch (e) {
      if (!isOAuthCancelled(e)) {
        setError(e instanceof Error ? e.message : 'OAuth sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  const openLegal = (path: '/terms' | '/privacy') => {
    const origin = (process.env.EXPO_PUBLIC_WEB_ORIGIN ?? process.env.EXPO_PUBLIC_APP_API_URL ?? 'https://app.rinsehq.com').replace(/\/$/, '')
    void Linking.openURL(`${origin}${path}`)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <RinseLockupAnimated height={36} />
        </View>

        <AppText variant="h1" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="body" style={styles.tagline}>
          {subtitle}
        </AppText>

        {!configured ? (
          <AppText variant="caption" style={styles.banner}>
            Set EXPO_PUBLIC_PB_URL in .env to connect.
          </AppText>
        ) : backendHealthy === false ? (
          <AppText variant="caption" style={styles.banner}>
            Cannot reach PocketBase. Check your network and PB URL.
          </AppText>
        ) : null}

        {mode !== 'forgot' ? (
          <View style={styles.oauthCol}>
            <SecondaryButton
              label="Continue with Google"
              onPress={() => void onOAuth('google')}
              disabled={busy}
            />
            <SecondaryButton
              label="Continue with Apple"
              onPress={() => void onOAuth('apple')}
              disabled={busy}
            />
          </View>
        ) : null}

        {mode === 'signup' ? (
          <Field
            label="Business name"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {mode !== 'forgot' ? (
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={mode === 'signup' ? '8+ characters' : undefined}
          />
        ) : null}

        {mode === 'signup' && slugPreview ? (
          <AppText variant="caption" style={styles.slugPreview}>
            Booking link: <AppText style={styles.slugStrong}>/book/{slugPreview}</AppText>
          </AppText>
        ) : null}

        {error ? (
          <AppText variant="caption" style={styles.error} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        {info ? (
          <AppText variant="caption" style={styles.info}>
            {info}
          </AppText>
        ) : null}

        <PrimaryButton
          label={
            busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'
          }
          onPress={() => void onSubmit()}
          loading={busy}
          disabled={!configured}
        />

        {mode === 'login' ? (
          <Pressable onPress={() => switchMode('forgot')} accessibilityRole="button">
            <AppText style={styles.modeLink}>Forgot password?</AppText>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => switchMode(mode === 'forgot' ? 'login' : mode === 'login' ? 'signup' : 'login')}
          accessibilityRole="button"
        >
          <AppText style={styles.modeLink}>
            {mode === 'login'
              ? 'New here? Create an account'
              : mode === 'signup'
                ? 'Already have an account? Sign in'
                : 'Back to sign in'}
          </AppText>
        </Pressable>

        <AppText variant="caption" style={styles.legal}>
          By signing up, you are agreeing to our{' '}
          <AppText variant="caption" style={styles.legalLink} onPress={() => openLegal('/terms')}>
            Terms
          </AppText>
          .
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  placeholder,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'sentences' | 'words'
  placeholder?: string
}) {
  return (
    <View style={styles.field}>
      <AppText variant="sectionLabel">{label}</AppText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    paddingTop: 72,
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.displayBold,
    lineHeight: 32,
  },
  tagline: {
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  banner: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  slugPreview: {
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
  slugStrong: {
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  error: {
    color: colors.danger,
  },
  info: {
    color: colors.greenText,
  },
  oauthCol: {
    gap: spacing.sm,
  },
  modeLink: {
    textAlign: 'center',
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  legal: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  legalLink: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
  },
})
