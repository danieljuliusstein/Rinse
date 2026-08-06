import type { PageId } from '@/lib/types'

export type ArticleCta = {
  label: string
  page: PageId
  variant: 'primary' | 'outline'
}

export type ArticleBlock = {
  type: 'paragraph' | 'steps' | 'callout' | 'chip-list'
  text?: string
  items?: string[]
  title?: string
  chips?: string[]
}

export type CategoryId =
  | 'getting-started'
  | 'deals'
  | 'inbox'
  | 'money'
  | 'schedule'
  | 'growth'
  | 'settings'
  | 'tips'

export type Category = {
  id: CategoryId
  label: string
  icon: string
}

export type Article = {
  id: string
  title: string
  category: CategoryId
  body: ArticleBlock[]
  ctas: ArticleCta[]
  icon: string
}

export const categories: Category[] = [
  { id: 'getting-started', label: 'Getting started', icon: 'Sparkles' },
  { id: 'deals', label: 'Deals & pipeline', icon: 'KanbanSquare' },
  { id: 'inbox', label: 'Inbox & chat', icon: 'Inbox' },
  { id: 'money', label: 'Money & invoices', icon: 'Wallet' },
  { id: 'schedule', label: 'Calendar & routes', icon: 'CalendarDays' },
  { id: 'growth', label: 'Campaigns & automations', icon: 'Megaphone' },
  { id: 'settings', label: 'Settings & account', icon: 'Settings' },
  { id: 'tips', label: 'Tips', icon: 'Lightbulb' },
]

export const articles: Article[] = [
  {
    id: 'get-started',
    title: 'How do I get started?',
    category: 'getting-started',
    icon: 'Rocket',
    body: [
      {
        type: 'paragraph',
        text: 'Welcome to Rinse Desk. In a few minutes you can have your detailing shop organized — contacts imported, your first deal in the pipeline, and your inbox ready for customer chats.',
      },
      {
        type: 'steps',
        title: 'Your first five minutes',
        items: [
          'Add your business name and logo in Settings so quotes and receipts look like you.',
          'Import or hand-add the customers you already text with into Contacts.',
          'Create your first deal and move it across the pipeline: Inquiry → Quoted → Scheduled.',
          'Open Inbox so new chats land in the right folder automatically.',
        ],
      },
      {
        type: 'callout',
        title: 'Detailing-first',
        text: 'Desk is built around the way mobile detailers work — a simple pipeline, a unified inbox, and a calendar that knows the difference between a full paint correction and a quick wash-and-wax.',
      },
    ],
    ctas: [
      { label: 'Open Contacts', page: 'contacts', variant: 'primary' },
      { label: 'Open Deals', page: 'deals', variant: 'primary' },
    ],
  },
  {
    id: 'create-new',
    title: 'What does + Create New do?',
    category: 'getting-started',
    icon: 'PlusCircle',
    body: [
      {
        type: 'paragraph',
        text: 'The green + Create New button in the header is the fastest way to add work without leaving the page you are on.',
      },
      {
        type: 'chip-list',
        title: 'Quick creates',
        chips: ['Contact', 'Deal', 'Event', 'Expense'],
      },
      {
        type: 'callout',
        title: 'Tip',
        text: 'After you create a contact or deal, Desk jumps you to the right place so you can keep going — quote the deal, book the job, or open the thread.',
      },
    ],
    ctas: [
      { label: 'Open Contacts', page: 'contacts', variant: 'outline' },
      { label: 'Open Deals', page: 'deals', variant: 'primary' },
    ],
  },
  {
    id: 'pipeline-stages',
    title: 'What are the pipeline stages?',
    category: 'deals',
    icon: 'GitBranch',
    body: [
      {
        type: 'paragraph',
        text: "Every deal moves through three lightweight stages. You don't need a dozen columns — just enough to know what needs your attention today.",
      },
      {
        type: 'chip-list',
        title: 'The three stages',
        chips: ['Inquiry', 'Quoted', 'Scheduled'],
      },
      {
        type: 'steps',
        title: 'How deals flow',
        items: [
          "Inquiry — a new lead asks about a detail. You haven't quoted yet.",
          "Quoted — you've sent a price. Waiting on their yes.",
          "Scheduled — they've booked. It's now a job on your calendar.",
        ],
      },
      {
        type: 'callout',
        title: 'Lost & won',
        text: "Deals you close go to Scheduled. Deals that go quiet can be archived — they're never deleted, so you can revive them when a customer texts back three months later.",
      },
    ],
    ctas: [{ label: 'Open Deals', page: 'deals', variant: 'primary' }],
  },
  {
    id: 'book-deal-job',
    title: 'How do I book a deal as a job?',
    category: 'deals',
    icon: 'CalendarCheck',
    body: [
      {
        type: 'paragraph',
        text: "When a customer says yes, you turn the deal into a scheduled job. Desk drops it on your calendar and keeps the chat thread attached so you never lose the context.",
      },
      {
        type: 'steps',
        title: 'Booking a job',
        items: [
          'Hover a deal card and choose Book, or move it to Scheduled.',
          'Pick a job date and optional start time.',
          'Confirm — the deal moves to Scheduled and appears on Calendar.',
          'Open the job later from Calendar or the deal card to update status.',
        ],
      },
      {
        type: 'callout',
        title: 'Rebooking',
        text: 'Past jobs can be rebooked quickly — great for monthly ceramic-refresh customers who always come back.',
      },
    ],
    ctas: [
      { label: 'Open Deals', page: 'deals', variant: 'primary' },
      { label: 'Open Calendar', page: 'calendar', variant: 'outline' },
    ],
  },
  {
    id: 'inbox-work',
    title: 'How does the Inbox work?',
    category: 'inbox',
    icon: 'Inbox',
    body: [
      {
        type: 'paragraph',
        text: 'The Inbox pulls every customer conversation into one place — text, email, and chat — and sorts them into folders so you can triage fast instead of hunting across apps.',
      },
      {
        type: 'chip-list',
        title: 'Folder rail',
        chips: ['Assigned', 'Unassigned', 'All open', 'Chat', 'Email', 'Calls', 'Sent', 'Closed', 'Others'],
      },
      {
        type: 'steps',
        title: 'Triaging a shift',
        items: [
          'Start in Unassigned — anything new that needs an owner.',
          'Move to Assigned to follow up on your active threads.',
          'Reply directly from the thread; drafts auto-save as you type.',
          "When the job's booked or the question's answered, close the thread.",
        ],
      },
      {
        type: 'callout',
        title: 'Unread vs. read',
        text: "Unread threads stay bold in the rail. Once you open them they're marked read — but you can pin a thread to keep it on top if you're waiting on a reply.",
      },
    ],
    ctas: [{ label: 'Open Inbox', page: 'chat', variant: 'primary' }],
  },
  {
    id: 'link-chat-contact',
    title: 'How do I link a chat to a contact?',
    category: 'inbox',
    icon: 'Link2',
    body: [
      {
        type: 'paragraph',
        text: "When a new number or email messages you, Desk tries to match it to an existing contact. If it can't, you can link it manually in a couple of taps.",
      },
      {
        type: 'steps',
        title: 'Linking a thread',
        items: [
          'Open the unassigned thread in the Inbox.',
          'Choose Link contact from the details panel.',
          'Search the customer name or create a new contact.',
          'Future messages from that number route to the same contact automatically.',
        ],
      },
      {
        type: 'callout',
        title: 'Why it matters',
        text: 'Linked chats carry the contact\'s deal history and past jobs into the thread — so you\'re never asking "what package did you get last time?"',
      },
    ],
    ctas: [{ label: 'Open Inbox', page: 'chat', variant: 'primary' }],
  },
  {
    id: 'inbox-create-deal',
    title: 'Can I create a deal from a chat?',
    category: 'inbox',
    icon: 'MessageSquarePlus',
    body: [
      {
        type: 'paragraph',
        text: 'Yes. When a thread is linked to a contact, the right panel lets you start a deal or draft a calendar meet without leaving Inbox.',
      },
      {
        type: 'steps',
        title: 'From the contact panel',
        items: [
          'Select a thread with a linked contact.',
          'In the right panel, choose Create deal to open a new Inquiry.',
          'Or choose Meet to draft a calendar event for that contact.',
        ],
      },
    ],
    ctas: [
      { label: 'Open Inbox', page: 'chat', variant: 'primary' },
      { label: 'Open Deals', page: 'deals', variant: 'outline' },
    ],
  },
  {
    id: 'invoices-send',
    title: 'How do I create and send an invoice?',
    category: 'money',
    icon: 'FileText',
    body: [
      {
        type: 'paragraph',
        text: 'Invoices live under Money. You can draft from a completed job, edit line items, then send or mark paid when the customer settles up.',
      },
      {
        type: 'steps',
        title: 'Invoice flow',
        items: [
          'Open Invoices (or Money overview for the big picture).',
          'Create or open a draft tied to a job and contact.',
          'Adjust packages, add-ons, and tax as needed.',
          'Send the invoice, then mark paid or partial when payment lands.',
        ],
      },
      {
        type: 'callout',
        title: 'Aging',
        text: 'Overdue invoices surface on Money overview and Dashboard collection widgets so nothing sits unpaid unnoticed.',
      },
    ],
    ctas: [
      { label: 'Open Invoices', page: 'invoices', variant: 'primary' },
      { label: 'Money overview', page: 'money', variant: 'outline' },
    ],
  },
  {
    id: 'receipts-expenses',
    title: 'How do I log expenses and payments?',
    category: 'money',
    icon: 'Receipt',
    body: [
      {
        type: 'paragraph',
        text: 'Receipts tracks shop spending and payment receipts in one place — expenses you paid out, and payments customers made on invoices.',
      },
      {
        type: 'chip-list',
        title: 'Segments',
        chips: ['Expenses', 'Payments'],
      },
      {
        type: 'steps',
        title: 'Logging an expense',
        items: [
          'Open Receipts and stay on Expenses.',
          'Add a vendor, amount, category, and optional photo of the receipt.',
          'Save — it shows up in Money overview and Dashboard widgets.',
        ],
      },
    ],
    ctas: [
      { label: 'Open Receipts', page: 'receipts', variant: 'primary' },
      { label: 'Money overview', page: 'money', variant: 'outline' },
    ],
  },
  {
    id: 'money-overview',
    title: 'What is Money overview?',
    category: 'money',
    icon: 'Wallet',
    body: [
      {
        type: 'paragraph',
        text: 'Money overview is your cash pulse — revenue won, invoice collection, and recent payment activity without digging through every list.',
      },
      {
        type: 'callout',
        title: 'Drill down',
        text: 'Use the overview to spot overdue invoices, then jump into Invoices or Receipts to act on them.',
      },
    ],
    ctas: [
      { label: 'Money overview', page: 'money', variant: 'primary' },
      { label: 'Open Invoices', page: 'invoices', variant: 'outline' },
    ],
  },
  {
    id: 'calendar-basics',
    title: 'How does the calendar work?',
    category: 'schedule',
    icon: 'CalendarDays',
    body: [
      {
        type: 'paragraph',
        text: 'Calendar shows booked jobs and events across week, day, and list views. Jobs booked from Deals land here with the contact and package attached.',
      },
      {
        type: 'steps',
        title: 'Working the day',
        items: [
          'Switch between week, day, and schedule list views.',
          'Click an event for details, status, and contact context.',
          'Use category colors so wash vs correction jobs are easy to scan.',
          'From here you can jump into Routes for the day’s stop order.',
        ],
      },
    ],
    ctas: [
      { label: 'Open Calendar', page: 'calendar', variant: 'primary' },
      { label: 'Open Routes', page: 'routes', variant: 'outline' },
    ],
  },
  {
    id: 'routes-day',
    title: 'How do I plan a route for the day?',
    category: 'schedule',
    icon: 'Map',
    body: [
      {
        type: 'paragraph',
        text: 'Routes turns today’s jobs into a run sheet — stop order, map, and an action dock so you know where to roll next.',
      },
      {
        type: 'steps',
        title: 'Building a run',
        items: [
          'Open Routes and pick the day you are working.',
          'Schedule stops from the run sheet — they stay on this day.',
          'Reorder or optimize when addresses make a cleaner loop.',
          'Use the action dock as you complete each stop.',
        ],
      },
      {
        type: 'callout',
        title: 'Addresses',
        text: 'Contacts and jobs with addresses geocode for the map. Missing pins usually mean the contact address needs a quick update.',
      },
    ],
    ctas: [
      { label: 'Open Routes', page: 'routes', variant: 'primary' },
      { label: 'Open Calendar', page: 'calendar', variant: 'outline' },
    ],
  },
  {
    id: 'fleet-cars',
    title: 'How do I manage my fleet / cars?',
    category: 'schedule',
    icon: 'Car',
    body: [
      {
        type: 'paragraph',
        text: 'Cars tracks vehicles you detail — type, notes, and damage photos — so you remember what was on the lot last time.',
      },
      {
        type: 'steps',
        title: 'Fleet basics',
        items: [
          'Open Cars to browse the fleet list.',
          'Select a vehicle for detail, type, and history.',
          'Attach damage photos so before/after disputes are easy to settle.',
        ],
      },
    ],
    ctas: [{ label: 'Open Cars', page: 'cars', variant: 'primary' }],
  },
  {
    id: 'campaigns-send',
    title: 'How do I send a campaign?',
    category: 'growth',
    icon: 'Megaphone',
    body: [
      {
        type: 'paragraph',
        text: 'Campaigns let you email a segment of contacts — seasonal promos, ceramic refresh reminders, or win-back notes for quiet leads.',
      },
      {
        type: 'steps',
        title: 'Launch flow',
        items: [
          'Open Campaigns and create a new campaign.',
          'Write the subject and body in the editor.',
          'Choose who receives it from your contacts.',
          'Send or schedule — open rates show up after delivery.',
        ],
      },
    ],
    ctas: [{ label: 'Open Campaigns', page: 'campaigns', variant: 'primary' }],
  },
  {
    id: 'forms-intake',
    title: 'How do customer forms work?',
    category: 'growth',
    icon: 'ClipboardList',
    body: [
      {
        type: 'paragraph',
        text: 'Forms capture intake — vehicle details, package interest, and photos — before a job so you show up prepared.',
      },
      {
        type: 'steps',
        title: 'Using forms',
        items: [
          'Open Forms to list or create a form.',
          'Edit fields in the form editor.',
          'Share the form with customers; submissions land back in Desk.',
        ],
      },
    ],
    ctas: [{ label: 'Open Forms', page: 'forms', variant: 'primary' }],
  },
  {
    id: 'automations-basics',
    title: 'How do automations work?',
    category: 'growth',
    icon: 'Workflow',
    body: [
      {
        type: 'paragraph',
        text: 'Automations run if-this-then-that workflows — for example, when a deal moves to Quoted, draft a follow-up, or when a job completes, nudge an invoice.',
      },
      {
        type: 'steps',
        title: 'Building a workflow',
        items: [
          'Open Automations and create or select a workflow.',
          'Drag triggers and actions onto the canvas.',
          'Configure each node in the inspector.',
          'Save and turn the automation on when you are ready.',
        ],
      },
      {
        type: 'callout',
        title: 'Start small',
        text: 'One solid automation (quote follow-up or job-complete invoice) beats a dozen half-finished graphs.',
      },
    ],
    ctas: [{ label: 'Open Automations', page: 'automations', variant: 'primary' }],
  },
  {
    id: 'activities-log',
    title: 'How do I log activities?',
    category: 'growth',
    icon: 'ListTodo',
    body: [
      {
        type: 'paragraph',
        text: 'Activities is your call / email / meeting log — useful when something happened offline and you still want it on the contact timeline.',
      },
      {
        type: 'steps',
        title: 'Logging',
        items: [
          'Open Activities.',
          'Use the log form to pick type, contact, and notes.',
          'Save — it shows on the timeline and related contact context.',
        ],
      },
    ],
    ctas: [{ label: 'Open Activities', page: 'activities', variant: 'primary' }],
  },
  {
    id: 'settings-ai-assist',
    title: 'Where are Settings and AI Assist?',
    category: 'settings',
    icon: 'SlidersHorizontal',
    body: [
      {
        type: 'paragraph',
        text: 'Settings and AI Assist live at the bottom of the sidebar, right next to Help. Settings controls your business profile, schedule, and preferences. AI Assist is your always-on copilot for drafting replies and summarizing threads.',
      },
      {
        type: 'steps',
        title: 'What lives where',
        items: [
          'Settings — business name, logo, hours, notifications, account.',
          'AI Assist — draft replies, summarize long threads, suggest next steps.',
          'Help (this tab) — guides and how-tos. Not a replacement for AI Assist.',
        ],
      },
      {
        type: 'callout',
        title: 'Still stuck?',
        text: "If a guide doesn't answer it, AI Assist can often help right inside the product — or email support and we'll get back to you.",
      },
    ],
    ctas: [
      { label: 'Open Settings', page: 'settings', variant: 'primary' },
      { label: 'AI Assist', page: 'ai', variant: 'outline' },
    ],
  },
  {
    id: 'update-business-name',
    title: 'How do I update my business name?',
    category: 'settings',
    icon: 'Store',
    body: [
      {
        type: 'paragraph',
        text: 'Your business name shows up on quotes, receipts, and booking confirmations. Updating it takes a few seconds and applies everywhere going forward.',
      },
      {
        type: 'steps',
        title: 'Updating your name',
        items: [
          'Open Settings from the bottom of the sidebar.',
          'Under Business profile, edit the Business name field.',
          'Save — new quotes and confirmations use the updated name immediately.',
        ],
      },
      {
        type: 'callout',
        title: 'Logo & branding',
        text: 'You can swap your logo and brand colors in the same screen. Past receipts keep their original branding — only new documents pick up the change.',
      },
    ],
    ctas: [{ label: 'Open Settings', page: 'settings', variant: 'primary' }],
  },
  {
    id: 'quiet-hours',
    title: 'How do quiet hours and notifications work?',
    category: 'settings',
    icon: 'Bell',
    body: [
      {
        type: 'paragraph',
        text: 'Quiet hours and notification prefs live in Settings so Desk does not ping you at midnight about every chat.',
      },
      {
        type: 'steps',
        title: 'Tune alerts',
        items: [
          'Open Settings → Preferences for quiet hours.',
          'Open Settings → Notifications to choose which events alert you.',
          'Save — preferences sync with mobile where available.',
        ],
      },
    ],
    ctas: [{ label: 'Open Settings', page: 'settings', variant: 'primary' }],
  },
  {
    id: 'ai-assist-help',
    title: 'How do I use AI Assist for help?',
    category: 'settings',
    icon: 'Sparkles',
    body: [
      {
        type: 'paragraph',
        text: 'AI Assist reads your Desk data and suggests next steps — overdue invoices, quiet leads, draft replies — without leaving the app.',
      },
      {
        type: 'steps',
        title: 'Ask Assist',
        items: [
          'Open AI Assist from the sidebar sparkle icon.',
          'Pick a chip or type a question; optionally scope to a contact.',
          'Follow the suggested jumps into Deals, Inbox, or Invoices.',
        ],
      },
      {
        type: 'callout',
        title: 'Help vs Assist',
        text: 'Help (this page) is static how-tos. AI Assist is live suggestions from your actual CRM data.',
      },
    ],
    ctas: [
      { label: 'Open AI Assist', page: 'ai', variant: 'primary' },
      { label: 'Open Inbox', page: 'chat', variant: 'outline' },
    ],
  },
  {
    id: 'tips-shortcuts',
    title: 'Tips: sidebar, drafts & threads',
    category: 'tips',
    icon: 'Lightbulb',
    body: [
      {
        type: 'paragraph',
        text: 'A few small habits make Desk feel a lot faster. None of these change your data — they just save clicks.',
      },
      {
        type: 'steps',
        title: 'Try these',
        items: [
          'Collapse the sidebar to give the board or inbox more room.',
          'Draft replies auto-save — close a thread and come back without losing your text.',
          'Unread threads stay bold in the rail; opening marks them read.',
          'Use header search to jump to contacts, deals, jobs, and invoices.',
        ],
      },
      {
        type: 'callout',
        title: 'No jump needed',
        text: 'These tips work across every tab — no setup required. Just start using them.',
      },
    ],
    ctas: [],
  },
  {
    id: 'tips-dashboard',
    title: 'How do I read the Dashboard?',
    category: 'tips',
    icon: 'LayoutDashboard',
    body: [
      {
        type: 'paragraph',
        text: 'Dashboard is your morning brief — new contacts, deal pipeline, invoice collection, job status, and recent activity in one glance.',
      },
      {
        type: 'callout',
        title: 'Widgets',
        text: 'Click into a widget when something looks off — most cards deep-link into Deals, Contacts, Invoices, or Inbox.',
      },
    ],
    ctas: [{ label: 'Open Dashboard', page: 'dashboard', variant: 'primary' }],
  },
  {
    id: 'tips-search-help',
    title: 'How do I find answers in Help?',
    category: 'tips',
    icon: 'CircleHelp',
    body: [
      {
        type: 'paragraph',
        text: 'Use the search bar at the top of Help, or filter by topic in the left rail. Articles open in the main pane with step-by-step jumps into the product.',
      },
      {
        type: 'steps',
        title: 'Finding a guide',
        items: [
          'Type a keyword (invoice, route, deal, inbox…).',
          'Or pick a topic like Money & invoices or Calendar & routes.',
          'Open an article, then use Jump into the product buttons.',
        ],
      },
      {
        type: 'callout',
        title: 'Still need a human?',
        text: 'Email support@rinse.com or open AI Assist for a data-aware suggestion.',
      },
    ],
    ctas: [{ label: 'Open AI Assist', page: 'ai', variant: 'outline' }],
  },
]
