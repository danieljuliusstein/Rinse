import type { ReactNode } from 'react'
import { JetBrains_Mono } from 'next/font/google'
import '../demo/admin-dashboard/admin-dashboard.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-admin-mono',
})

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={jetbrainsMono.variable}>{children}</div>
}
