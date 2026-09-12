'use client'

import { useEffect } from 'react'

export function usePortalTheme(dark: boolean) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const shell = document.querySelector('.app-shell') as HTMLElement | null
    const hadDarkClass = html.classList.contains('dark')
    const prevColorScheme = html.style.colorScheme
    const prevBodyBg = body.style.background
    const prevShellBg = shell?.style.background ?? ''

    html.classList.remove('dark')
    html.style.colorScheme = dark ? 'dark' : 'light'
    body.style.background = dark ? '#111111' : '#FAFAFA'
    if (shell) shell.style.background = dark ? '#111111' : '#FAFAFA'

    return () => {
      if (hadDarkClass) html.classList.add('dark')
      else html.classList.remove('dark')
      html.style.colorScheme = prevColorScheme
      body.style.background = prevBodyBg
      if (shell) shell.style.background = prevShellBg
    }
  }, [dark])
}
