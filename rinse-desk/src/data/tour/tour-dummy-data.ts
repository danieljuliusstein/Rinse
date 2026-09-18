// tour-dummy-data.ts — rich dummy data for the desktop onboarding tour.
import type {
  DeskActivity,
  DeskCampaign,
  DeskClient,
  DeskExpense,
  DeskInvoice,
  DeskJob,
  DeskLead,
  DeskPackage,
  DeskVehicle,
} from '@/lib/types'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTourDummyClients(): DeskClient[] {
  const today = todayISO()
  return [
    {
      id: 'tour-client-marcus',
      name: 'Marcus Vance',
      phone: '(555) 234-5678',
      email: 'marcus.vance@example.com',
      address: '742 Evergreen Terrace, Austin, TX',
      lat: 30.2672,
      lng: -97.7431,
      geocoded_at: today,
      notes: 'VIP customer. Weekly maintenance wash for Porsche 911 GT3.',
      tags: ['VIP', 'Weekly'],
      lead_source: 'Instagram',
      created: today,
    },
    {
      id: 'tour-client-sarah',
      name: 'Sarah Jenkins',
      phone: '(555) 876-5432',
      email: 'sarah.j@example.com',
      address: '1204 Oak Ridge Way, Austin, TX',
      lat: 30.2849,
      lng: -97.7341,
      geocoded_at: today,
      notes: 'Referred by Dave. Interested in full interior detail and leather coating.',
      tags: ['Retail'],
      lead_source: 'Referral',
      created: today,
    },
    {
      id: 'tour-client-dave',
      name: 'Dave Miller',
      phone: '(555) 345-6789',
      email: 'dave.miller@example.com',
      address: '550 Congress Ave, Austin, TX',
      lat: 30.2500,
      lng: -97.7500,
      geocoded_at: today,
      notes: 'Fleet manager for 3 commercial work trucks. Bi-weekly service.',
      tags: ['Fleet', 'Commercial'],
      lead_source: 'Website',
      created: today,
    },
    {
      id: 'tour-client-elena',
      name: 'Elena Rostova',
      phone: '(555) 901-2345',
      email: 'elena.r@example.com',
      address: '310 Barton Springs Rd, Austin, TX',
      lat: 30.2600,
      lng: -97.7600,
      geocoded_at: today,
      notes: 'Inquiry for 5-year ceramic coating and paint correction.',
      tags: ['Retail'],
      lead_source: 'Booking Link',
      created: today,
    },
  ]
}

export function getTourDummyVehicles(): DeskVehicle[] {
  return [
    {
      id: 'tour-veh-porsche',
      client_id: 'tour-client-marcus',
      year: 2023,
      make: 'Porsche',
      model: '911 GT3',
      color: 'Shark Blue',
      color_hex: '#0055ff',
      type: 'other',
      plate: 'GT3-TX',
    },
    {
      id: 'tour-veh-tesla',
      client_id: 'tour-client-sarah',
      year: 2024,
      make: 'Tesla',
      model: 'Model Y',
      color: 'Solid Black',
      color_hex: '#111111',
      type: 'suv',
      plate: 'EV-884',
    },
    {
      id: 'tour-veh-truck',
      client_id: 'tour-client-dave',
      year: 2022,
      make: 'Ford',
      model: 'F-150 Lightning',
      color: 'Oxford White',
      color_hex: '#ffffff',
      type: 'truck',
      plate: 'FLEET-01',
    },
    {
      id: 'tour-veh-bmw',
      client_id: 'tour-client-elena',
      year: 2021,
      make: 'BMW',
      model: 'M4 Competition',
      color: 'Isle of Man Green',
      color_hex: '#054e38',
      type: 'sedan',
      plate: 'M4-COMP',
    },
  ]
}

export function getTourDummyPackages(): DeskPackage[] {
  return [
    {
      id: 'tour-pkg-ceramic',
      name: 'Full Ceramic & Correction',
      base_price: 950,
      active: true,
    },
    {
      id: 'tour-pkg-signature',
      name: 'Signature Interior & Exterior',
      base_price: 350,
      active: true,
    },
    {
      id: 'tour-pkg-maintenance',
      name: 'Maintenance Wash',
      base_price: 120,
      active: true,
    },
  ]
}

export function getTourDummyLeads(): DeskLead[] {
  return [
    {
      id: 'tour-lead-1',
      name: 'Elena Rostova',
      client_id: 'tour-client-elena',
      phone: '(555) 901-2345',
      service_interest: 'Full Ceramic Coating & Paint Correction',
      vehicle_type: '2021 BMW M4',
      quote_amount: 1250,
      stage: 'inquiry',
      source: 'Booking Link',
      packageName: 'Full Ceramic & Correction',
      package_id: 'tour-pkg-ceramic',
      created: todayISO(),
    },
    {
      id: 'tour-lead-2',
      name: 'Alex Turner',
      phone: '(555) 777-8899',
      service_interest: 'Express Wash & Interior Steam',
      vehicle_type: 'Audi RS6 Avant',
      quote_amount: 280,
      stage: 'inquiry',
      source: 'Instagram',
      packageName: 'Signature Interior & Exterior',
      package_id: 'tour-pkg-signature',
      created: todayISO(),
    },
    {
      id: 'tour-lead-3',
      name: 'Sarah Jenkins',
      client_id: 'tour-client-sarah',
      phone: '(555) 876-5432',
      service_interest: 'Signature Interior & Leather Guard',
      vehicle_type: '2024 Tesla Model Y',
      quote_amount: 350,
      stage: 'quoted',
      source: 'Referral',
      packageName: 'Signature Interior & Exterior',
      package_id: 'tour-pkg-signature',
      created: todayISO(),
    },
    {
      id: 'tour-lead-4',
      name: 'Dave Miller',
      client_id: 'tour-client-dave',
      phone: '(555) 345-6789',
      service_interest: 'Fleet Maintenance Package (3 trucks)',
      vehicle_type: 'Commercial Fleet',
      quote_amount: 890,
      stage: 'quoted',
      source: 'Website',
      packageName: 'Maintenance Wash',
      package_id: 'tour-pkg-maintenance',
      created: todayISO(),
    },
    {
      id: 'tour-lead-5',
      name: 'Marcus Vance',
      client_id: 'tour-client-marcus',
      phone: '(555) 234-5678',
      service_interest: 'Level 2 Paint Correction & Ceramic',
      vehicle_type: '2023 Porsche 911 GT3',
      quote_amount: 950,
      stage: 'booked',
      source: 'Repeat VIP',
      packageName: 'Full Ceramic & Correction',
      package_id: 'tour-pkg-ceramic',
      created: todayISO(),
    },
  ]
}

export function getTourDummyJobs(): DeskJob[] {
  const today = todayISO()
  const tomorrow = tomorrowISO()
  const clients = getTourDummyClients()

  return [
    {
      id: 'tour-job-1',
      date: today,
      start_time: '09:00',
      status: 'in_progress',
      revenue: 950,
      tip: 50,
      client_id: 'tour-client-marcus',
      package_id: 'tour-pkg-ceramic',
      packageName: 'Full Ceramic & Correction',
      vehicle_type: '2023 Porsche 911 GT3',
      notes: 'Customer requested wheel coating add-on.',
      hours_worked: 4,
      client: clients[0],
      created: today,
    },
    {
      id: 'tour-job-2',
      date: today,
      start_time: '14:30',
      status: 'scheduled',
      revenue: 350,
      tip: 0,
      client_id: 'tour-client-sarah',
      package_id: 'tour-pkg-signature',
      packageName: 'Signature Interior & Exterior',
      vehicle_type: '2024 Tesla Model Y',
      notes: 'Gate code #4421. Leave keys on front desk.',
      hours_worked: 2.5,
      client: clients[1],
      created: today,
    },
    {
      id: 'tour-job-3',
      date: tomorrow,
      start_time: '10:00',
      status: 'scheduled',
      revenue: 890,
      tip: 0,
      client_id: 'tour-client-dave',
      package_id: 'tour-pkg-maintenance',
      packageName: 'Maintenance Wash',
      vehicle_type: 'Commercial Fleet (3 Trucks)',
      notes: 'Security check-in required at gate 2.',
      hours_worked: 3,
      client: clients[2],
      created: today,
    },
  ]
}

export function getTourDummyInvoices(): DeskInvoice[] {
  const today = todayISO()
  return [
    {
      id: 'tour-inv-draft',
      invoice_number: 'INV-1001',
      job_id: 'tour-job-1',
      client_id: 'tour-client-marcus',
      subtotal: 950,
      tip: 0,
      total: 1028.38,
      status: 'draft',
      amount_paid: 0,
      balance_due: 1028.38,
      created: today,
    },
    {
      id: 'tour-inv-sent',
      invoice_number: 'INV-1000',
      job_id: 'tour-job-2',
      client_id: 'tour-client-sarah',
      subtotal: 350,
      tip: 0,
      total: 378.88,
      status: 'sent',
      amount_paid: 0,
      balance_due: 378.88,
      sent_at: today,
      created: today,
    },
    {
      id: 'tour-inv-paid',
      invoice_number: 'INV-0999',
      job_id: 'tour-job-3',
      client_id: 'tour-client-dave',
      subtotal: 890,
      tip: 50,
      total: 1013.43,
      status: 'paid',
      amount_paid: 1013.43,
      balance_due: 0,
      paid_at: today,
      created: today,
    },
  ]
}

export function getTourDummyExpenses(): DeskExpense[] {
  const today = todayISO()
  return [
    {
      id: 'tour-exp-1',
      name: 'CarPro CQuartz 3.0 Ceramic Kit',
      description: 'CarPro CQuartz 3.0 ceramic coating kit & suede applicator blocks',
      amount: 145.5,
      category: 'chemicals',
      date: today,
      vendor: 'Detailed Image',
    },
    {
      id: 'tour-exp-2',
      name: 'Eagle Edgeless Microfiber Towels',
      description: 'Eagle Edgeless 500 GSM microfiber towels (50-pack)',
      amount: 85.0,
      category: 'supplies',
      date: today,
      vendor: 'The Rag Company',
    },
    {
      id: 'tour-exp-3',
      name: 'Mobile Van Refuel',
      description: 'Mobile detailing service van refuel',
      amount: 62.25,
      category: 'fuel',
      date: today,
      vendor: 'Shell Oil',
    },
    {
      id: 'tour-exp-4',
      name: 'Rupes 21mm Yellow Foam Pads',
      description: 'Rupes 21mm yellow polishing foam pads & Sonax Perfect Finish',
      amount: 210.0,
      category: 'equipment',
      date: today,
      vendor: 'Autogeek',
    },
  ]
}

export function getTourDummyCampaigns(): DeskCampaign[] {
  const today = todayISO()
  return [
    {
      id: 'tour-camp-spring',
      name: 'Spring Ceramic Protection Special',
      status: 'active',
      channel: 'email',
      subject: 'Exclusive Spring Ceramic Protection for Your Vehicle',
      body: `Hi {{name}},\n\nSpring driving season is here, and it's the perfect time to shield your paint with our 5-year ceramic coating.\n\nBook before the end of the week and receive complimentary glass ceramic protection (a $150 value).\n\nTap below to claim your spot!`,
      audience_ids: ['tour-client-marcus', 'tour-client-sarah', 'tour-client-dave', 'tour-client-elena'],
      stats_sent: 124,
      stats_opened: 86,
      stats_clicked: 32,
      created: today,
    },
    {
      id: 'tour-camp-maintenance',
      name: 'Past Client 6-Month Maintenance Reminder',
      status: 'active',
      channel: 'email',
      subject: 'Is your ceramic coating ready for a 6-month decontamination wash?',
      body: `Hey {{name}},\n\nIt's been roughly six months since your last detailing appointment. To ensure your coating retains its deep gloss and hydrophobic water-beading performance, we recommend scheduling a decontamination booster wash.\n\nLet us know what day suits you best!`,
      audience_ids: ['tour-client-marcus', 'tour-client-sarah'],
      stats_sent: 58,
      stats_opened: 41,
      stats_clicked: 19,
      created: today,
    },
    {
      id: 'tour-camp-vip',
      name: 'VIP Multi-Stage Correction Upgrade',
      status: 'draft',
      channel: 'email',
      subject: 'VIP Offer: 20% off Multi-Stage Paint Correction',
      body: `Hi {{name}},\n\nAs one of our VIP repeat clients, we're offering an exclusive 20% savings on 2-stage paint correction and interior steam sterilization this month.\n\nReply directly to book with our master detailer.`,
      audience_ids: ['tour-client-marcus'],
      stats_sent: 0,
      stats_opened: 0,
      stats_clicked: 0,
      created: today,
    },
  ]
}

export function getTourDummyActivities(): DeskActivity[] {
  const today = todayISO()
  return [
    {
      id: 'tour-act-1',
      contact_id: 'tour-client-marcus',
      deal_id: 'tour-lead-5',
      type: 'email',
      direction: 'out',
      subject: 'Sent invoice INV-1001 for $1,028.38',
      body: 'Invoice sent via email with Stripe card payment link.',
      occurred_at: today,
      created: today,
    },
    {
      id: 'tour-act-2',
      contact_id: 'tour-client-marcus',
      deal_id: 'tour-lead-5',
      type: 'note',
      subject: 'Completed 2-Stage Paint Correction & CQuartz Ceramic',
      body: 'Applied 2 coats to Porsche 911 GT3. Swirl marks removed.',
      occurred_at: today,
      created: today,
    },
    {
      id: 'tour-act-3',
      contact_id: 'tour-client-sarah',
      deal_id: 'tour-lead-3',
      type: 'note',
      subject: 'Sent quote $350 for Signature Interior & Leather Guard',
      body: 'Customer inquiring about leather protection for 2024 Tesla Model Y.',
      occurred_at: today,
      created: today,
    },
    {
      id: 'tour-act-4',
      contact_id: 'tour-client-dave',
      deal_id: 'tour-lead-4',
      type: 'call',
      subject: 'Phone call regarding commercial fleet bi-weekly schedule',
      body: 'Dave confirmed 3 Ford F-150 Lightning trucks for recurring maintenance washes.',
      occurred_at: today,
      created: today,
    },
  ]
}
