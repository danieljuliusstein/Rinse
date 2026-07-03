import type { Metadata } from 'next'
import './embed.css'

export const metadata: Metadata = {
  title: 'Book online',
  robots: { index: false, follow: false },
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="embed-root client-light-root">{children}</div>
}
