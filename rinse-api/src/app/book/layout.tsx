import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#fafafa',
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children
}
