import type { ReactNode } from 'react'
import './demo-screens.css'

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className="demo-screens-root">{children}</div>
}
