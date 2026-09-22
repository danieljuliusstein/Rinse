export const PRIVACY_POLICY_UPDATED = 'July 12, 2026'

export type PrivacySection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export const PRIVACY_POLICY_SECTIONS: PrivacySection[] = [
  {
    title: 'Who this applies to',
    paragraphs: [
      'This policy covers the detailing business management app and public online booking pages operated through this platform. If you are a customer booking a detail, your detailer is responsible for how they use your information; this policy explains how the platform handles data on their behalf.',
    ],
  },
  {
    title: 'Information we collect',
    bullets: [
      'Business operators: account email, business profile (name, phone, address), jobs, clients, vehicles, invoices, inventory, and photos you upload.',
      'Customers booking online: name, phone, email (optional), service address, vehicle type, and appointment details submitted on the booking page.',
      'Device data: push notification tokens if you enable alerts; local app preferences on your device.',
    ],
  },
  {
    title: 'How we use information',
    paragraphs: ['We use collected data to:'],
    bullets: [
      'Run scheduling, CRM, invoicing, and reporting for your business',
      'Accept and record online bookings from your customers',
      'Send notifications you configure (reminders, follow-ups, invoice alerts)',
      'Back up and sync your business data when cloud sync is enabled',
    ],
  },
  {
    title: 'We do not sell personal information',
    paragraphs: ['We do not sell personal information.'],
  },
  {
    title: 'Storage & security',
    paragraphs: [
      'Cloud data is stored in PocketBase on secured infrastructure. Each business account is isolated by organization. Operators should use a strong password. Offline copies may exist on your device until synced.',
    ],
  },
  {
    title: 'Retention & deletion',
    paragraphs: [
      'While your subscription is active, business data is kept so you can run the shop. If you cancel, you keep Free access to jobs, clients, invoices, and photos — we do not delete your history because billing stopped, and you are not charged after cancel. Operators can export JSON/CSV anytime from Settings → Access and data on Free. To permanently delete your account and organization data, go to Settings → Access and data → Delete account. Customers should contact their detailer to update or remove booking information.',
    ],
  },
  {
    title: 'Third parties',
    paragraphs: [
      'We use infrastructure providers for hosting and may add email or payment processors as features roll out. Those services process data only as needed to provide the feature.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'Questions about this policy or your data? Email the privacy address shown below, or contact your detailer for booking-related requests.',
    ],
  },
]
