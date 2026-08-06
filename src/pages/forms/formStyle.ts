import type { CSSProperties } from 'react'
import type { DeskFormStyle } from '@/lib/types'
import { colors } from '@/theme/colors'

export const FORM_FONTS = [
  { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'ibm-plex', label: 'IBM Plex Sans', stack: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
  { id: 'fraunces', label: 'Fraunces', stack: "'Fraunces', Georgia, serif" },
  { id: 'newsreader', label: 'Newsreader', stack: "'Newsreader', Georgia, 'Times New Roman', serif" },
] as const

export const DEFAULT_FORM_STYLE: Required<
  Omit<DeskFormStyle, 'preset' | 'backgroundImage' | 'heading' | 'description'>
> &
  Pick<DeskFormStyle, 'preset' | 'backgroundImage' | 'heading' | 'description'> = {
  preset: 'clean',
  fontFamily: FORM_FONTS[0].stack,
  formWidth: 'md',
  backgroundColor: '#ffffff',
  backgroundImage: undefined,
  padding: 24,
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderRadius: 12,
  shadow: 'sm',
  labelColor: '#374151',
  labelSize: 12,
  labelWeight: 500,
  helpColor: '#9ca3af',
  inputStyle: 'box',
  inputBackground: '#ffffff',
  inputBorderColor: '#e5e7eb',
  inputTextColor: '#111827',
  inputPlaceholderColor: '#9ca3af',
  inputRadius: 8,
  inputHeight: 36,
  fieldGap: 14,
  buttonBackground: colors.green,
  buttonTextColor: '#ffffff',
  buttonRadius: 8,
  buttonHeight: 40,
  buttonFullWidth: true,
  buttonShadow: false,
  heading: undefined,
  headingColor: '#111827',
  headingSize: 22,
  description: undefined,
  descriptionColor: '#6b7280',
}

export const STYLE_PRESETS: {
  id: NonNullable<DeskFormStyle['preset']>
  label: string
  hint: string
  style: DeskFormStyle
}[] = [
  {
    id: 'clean',
    label: 'Clean',
    hint: 'Light card, soft borders',
    style: { ...DEFAULT_FORM_STYLE, preset: 'clean' },
  },
  {
    id: 'bold',
    label: 'Bold',
    hint: 'High-contrast CTA',
    style: {
      ...DEFAULT_FORM_STYLE,
      preset: 'bold',
      fontFamily: FORM_FONTS[2].stack,
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
      borderWidth: 0,
      borderRadius: 16,
      shadow: 'lg',
      labelColor: '#e2e8f0',
      helpColor: '#94a3b8',
      inputStyle: 'filled',
      inputBackground: '#1e293b',
      inputBorderColor: '#334155',
      inputTextColor: '#f8fafc',
      inputPlaceholderColor: '#64748b',
      inputRadius: 10,
      buttonBackground: '#22c55e',
      buttonTextColor: '#052e16',
      buttonRadius: 999,
      buttonHeight: 44,
      buttonShadow: true,
      headingColor: '#f8fafc',
      descriptionColor: '#94a3b8',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Underline inputs',
    style: {
      ...DEFAULT_FORM_STYLE,
      preset: 'minimal',
      fontFamily: FORM_FONTS[1].stack,
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      shadow: 'none',
      padding: 8,
      labelColor: '#0f172a',
      labelSize: 11,
      labelWeight: 600,
      inputStyle: 'underline',
      inputBackground: 'transparent',
      inputBorderColor: '#cbd5e1',
      inputRadius: 0,
      buttonBackground: '#0f172a',
      buttonTextColor: '#ffffff',
      buttonRadius: 0,
      buttonFullWidth: false,
    },
  },
  {
    id: 'dark',
    label: 'Ink',
    hint: 'Serif on charcoal',
    style: {
      ...DEFAULT_FORM_STYLE,
      preset: 'dark',
      fontFamily: FORM_FONTS[3].stack,
      backgroundColor: '#1c1917',
      borderColor: '#292524',
      borderRadius: 4,
      shadow: 'md',
      labelColor: '#d6d3d1',
      labelSize: 13,
      helpColor: '#78716c',
      inputStyle: 'box',
      inputBackground: '#0c0a09',
      inputBorderColor: '#44403c',
      inputTextColor: '#fafaf9',
      inputPlaceholderColor: '#78716c',
      inputRadius: 4,
      buttonBackground: '#fafaf9',
      buttonTextColor: '#1c1917',
      buttonRadius: 4,
      headingColor: '#fafaf9',
      descriptionColor: '#a8a29e',
    },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    hint: 'Warm paper + serif',
    style: {
      ...DEFAULT_FORM_STYLE,
      preset: 'editorial',
      fontFamily: FORM_FONTS[4].stack,
      backgroundColor: '#faf6f1',
      borderColor: '#e7ddd0',
      borderRadius: 2,
      shadow: 'none',
      padding: 28,
      labelColor: '#3f2e1f',
      labelSize: 13,
      labelWeight: 600,
      helpColor: '#a0896e',
      inputStyle: 'box',
      inputBackground: '#fffdf9',
      inputBorderColor: '#d6c7b4',
      inputTextColor: '#2a1f14',
      inputRadius: 2,
      buttonBackground: '#8b4513',
      buttonTextColor: '#fff8f0',
      buttonRadius: 2,
      buttonHeight: 42,
      headingColor: '#2a1f14',
      descriptionColor: '#7a6550',
    },
  },
]

export function resolveFormStyle(partial?: DeskFormStyle | null): Required<
  Omit<DeskFormStyle, 'preset' | 'backgroundImage' | 'heading' | 'description'>
> &
  DeskFormStyle {
  return { ...DEFAULT_FORM_STYLE, ...partial }
}

const WIDTH_PX: Record<NonNullable<DeskFormStyle['formWidth']>, string> = {
  sm: '320px',
  md: '400px',
  lg: '520px',
  full: '100%',
}

const SHADOW: Record<NonNullable<DeskFormStyle['shadow']>, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 8px 24px rgba(15, 23, 42, 0.1)',
  lg: '0 20px 40px rgba(15, 23, 42, 0.18)',
}

/** CSS custom properties consumed by FormRenderer */
export function formStyleToCssVars(style: DeskFormStyle): CSSProperties {
  const s = resolveFormStyle(style)
  return {
    ['--ff-font' as string]: s.fontFamily,
    ['--ff-width' as string]: WIDTH_PX[s.formWidth],
    ['--ff-bg' as string]: s.backgroundColor,
    ['--ff-bg-image' as string]: s.backgroundImage ? `url(${s.backgroundImage})` : 'none',
    ['--ff-pad' as string]: `${s.padding}px`,
    ['--ff-border-color' as string]: s.borderColor,
    ['--ff-border-width' as string]: `${s.borderWidth}px`,
    ['--ff-radius' as string]: `${s.borderRadius}px`,
    ['--ff-shadow' as string]: SHADOW[s.shadow],
    ['--ff-label' as string]: s.labelColor,
    ['--ff-label-size' as string]: `${s.labelSize}px`,
    ['--ff-label-weight' as string]: String(s.labelWeight),
    ['--ff-help' as string]: s.helpColor,
    ['--ff-input-bg' as string]: s.inputBackground,
    ['--ff-input-border' as string]: s.inputBorderColor,
    ['--ff-input-text' as string]: s.inputTextColor,
    ['--ff-input-ph' as string]: s.inputPlaceholderColor,
    ['--ff-input-radius' as string]: `${s.inputRadius}px`,
    ['--ff-input-height' as string]: `${s.inputHeight}px`,
    ['--ff-gap' as string]: `${s.fieldGap}px`,
    ['--ff-btn-bg' as string]: s.buttonBackground,
    ['--ff-btn-text' as string]: s.buttonTextColor,
    ['--ff-btn-radius' as string]: `${s.buttonRadius}px`,
    ['--ff-btn-height' as string]: `${s.buttonHeight}px`,
    ['--ff-btn-width' as string]: s.buttonFullWidth ? '100%' : 'auto',
    ['--ff-btn-shadow' as string]: s.buttonShadow ? '0 8px 20px rgba(0,0,0,0.18)' : 'none',
    ['--ff-heading' as string]: s.headingColor ?? DEFAULT_FORM_STYLE.headingColor!,
    ['--ff-heading-size' as string]: `${s.headingSize ?? 22}px`,
    ['--ff-desc' as string]: s.descriptionColor ?? DEFAULT_FORM_STYLE.descriptionColor!,
  } as CSSProperties
}
