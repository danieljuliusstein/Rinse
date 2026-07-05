import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  const updated = 'June 25, 2026'

  return (
    <div className="screen page-content legal-page client-light-root">
      <header className="legal-page__header">
        <Link href="/settings" className="legal-page__back">
          ← Settings
        </Link>
        <h1 className="legal-page__title">Privacy Policy</h1>
        <p className="legal-page__updated">Last updated {updated}</p>
      </header>

      <div className="legal-page__body rinse-prose">
        <section>
          <h2>Who this applies to</h2>
          <p>
            This policy covers the detailing business management app and public online booking pages
            operated through this platform. If you are a customer booking a detail, your detailer is
            responsible for how they use your information; this policy explains how the platform
            handles data on their behalf.
          </p>
        </section>

        <section>
          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Business operators:</strong> account email, business profile (name, phone,
              address), jobs, clients, vehicles, invoices, inventory, and photos you upload.
            </li>
            <li>
              <strong>Customers booking online:</strong> name, phone, email (optional), service
              address, vehicle type, and appointment details submitted on the booking page.
            </li>
            <li>
              <strong>Device data:</strong> push notification tokens if you enable alerts; local
              app preferences on your device.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use information</h2>
          <p>We use collected data to:</p>
          <ul>
            <li>Run scheduling, CRM, invoicing, and reporting for your business</li>
            <li>Accept and record online bookings from your customers</li>
            <li>Send notifications you configure (reminders, follow-ups, invoice alerts)</li>
            <li>Back up and sync your business data when cloud sync is enabled</li>
          </ul>
          <p>We do not sell personal information.</p>
        </section>

        <section>
          <h2>Storage &amp; security</h2>
          <p>
            Cloud data is stored in PocketBase on secured infrastructure. Each business account is
            isolated by organization. Operators should use a strong password. Offline copies may exist on your device until synced.
          </p>
        </section>

        <section>
          <h2>Retention &amp; deletion</h2>
          <p>
            Business data is kept while your account is active. Operators can export data from
            Settings → Access and data. To delete your account and associated organization data, go to
            Settings → Access and data → Delete account.
            Customers should contact their detailer to update or remove booking information.
          </p>
        </section>

        <section>
          <h2>Third parties</h2>
          <p>
            We use infrastructure providers for hosting and may add email or payment processors as
            features roll out. Those services process data only as needed to provide the feature.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this policy or your data? Email the address listed in your business
            settings or contact your app administrator.
          </p>
        </section>
      </div>
    </div>
  )
}
