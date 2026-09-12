export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'rinse_theme_v1'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_STORAGE_KEY, mode)
}

export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
  root.classList.toggle('dark', mode === 'dark')

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', mode === 'dark' ? '#0f0f0f' : '#f2f2f7')
  }
}

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');document.documentElement.style.colorScheme=t==='dark'?'dark':'light';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`
