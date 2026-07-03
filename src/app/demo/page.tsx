import Link from 'next/link'

const ROUTES = [
  { href: '/demo/home', label: 'Home dashboard' },
  { href: '/demo/jobs', label: 'Jobs list' },
  { href: '/demo/invoice', label: 'Invoice preview' },
  { href: '/demo/booking', label: 'Booking flow (live)' },
  { href: '/demo/setup-motion', label: 'Wave 48 — setup motion (replay)' },
  { href: '/demo/delight-motion', label: 'Wave 55 — delight & depth QA' },
]

export default function DemoIndexPage() {
  return (
    <div className="demo-screens-index">
      <h1>Screenshot routes</h1>
      <p>390px frames for App Store and marketing captures. Open in desktop browser, screenshot the phone frame.</p>
      <ul>
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link href={route.href}>{route.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
