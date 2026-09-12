# LLM Council Transcript — Public Booking UI Improvements

**Date:** 2026-06-25  
**Original question:** Improve the public booking page UI; pass through LLM council before implementing.

---

## Framed Question

**Core decision:** How should we prioritize and approach the next round of UI improvements to the public booking page (`/book/[slug]`) in a multi-tenant mobile detailing SaaS?

**Product context:**
- B2B2C: solo mobile detailers use a dark-themed operator app; customers book via a shared link at `/book/[slug]`
- 3-step flow: (1) choose package, (2) pick date + time slot, (3) contact/vehicle/location details
- Light consumer theme (#f7f7f5, green #16a34a, Syne + DM Sans) intentionally distinct from operator dark UI
- Recent work ported patterns from QuickAddJob: Phosphor icons, package cards with CheckCircle, vehicle icon grid, location toggle, icon-prefixed inputs
- Known issues: date picker overlay failed; now visible native input in label wrapper; hydration warnings in dev; operator-app parity was a goal but light theme should stay

**Constraints:** Next.js, mobile-first ~390px, iOS Safari reliability, multi-tenant, don't break booking API/isolation.

**What's at stake:** Customer-facing conversion surface. Abandoned bookings = lost revenue and detailer churn.

---

## Advisor Responses

### The Contrarian

Stop polishing. You're cosplaying the operator app on a page where the user is a stressed car owner on a phone, not a detailer running a CRM. Porting QuickAddJob patterns (vehicle grid, location toggle, uppercase micro-labels) adds cognitive load without increasing bookings. The date picker broke twice because you fought the platform instead of embracing it — that's a warning sign.

**Do not:** custom calendar components, more icon parity with the dark app, animated step transitions, or a 4th "review" step. **Do not** hide the bottom nav on book routes while leaving a generic app chrome that screams "this is someone's internal tool."

**High-impact fixes you're avoiding:** sticky step summary (package + price always visible), one-tap phone call in header, clearer empty states when no slots exist, and fixing hydration so React doesn't corrupt inputs. **Vanity:** matching CheckCircle package cards to the operator UI — customers don't care, they care if "$320" is scary or clear.

The fatal flaw: optimizing for *designer satisfaction* ("looks like our app") instead of *completion rate* ("I know what to do next").

---

### The First Principles Thinker

Strip the question down: what is `/book/[slug]` actually for? One job — turn intent into a scheduled job with minimum friction. Not brand expression, not feature parity with QuickAddJob, not "light theme that still feels like our product."

The user journey in reality: tap link → trust this isn't spam → pick service → find a time that works → give contact info → feel confirmed. Every UI decision should be tested against those five beats.

**Worth doing:** (1) Trust layer up front — business name, photo/logo if available, service area hint, phone. (2) Collapse step 3 — vehicle type and location are operator fields; default smartly (mobile + sedan) behind "More options." (3) Step 2 should be *date-first, slots-second* with human copy ("Thursday, Jun 26" not ISO). (4) Confirmation screen that feels done — big check, what happens next, add-to-calendar.

**Not worth doing:** More Phosphor icons, finer typography tuning, or dark/light hybrid tokens. You're asking the wrong question — it's not "how to improve UI" but "how to remove decisions." The booking page should feel like Calendly, not like a CRM form ported to consumers.

---

### The Expansionist

You're undervaluing this page as a growth asset. Every detailer's booking link is a landing page. Right now it's functional but forgettable — no social proof, no upsell, no reason to choose the premium package.

**Upside moves:** (1) **Package merchandising** — "Most popular" badge, duration estimate ("~3 hrs"), before/after photo per package if detailer uploads in settings. That turns step 1 from a form into a menu. (2) **Smart defaults from URL** — `?package=full-detail` preselects; detailers embed links in Instagram bios. (3) **Post-booking loop** — confirmation page with "text us" deep link, review request placeholder, referral hook for the detailer's business (not your SaaS).

**UI polish that compounds:** Show running total + selected service in a persistent footer bar across steps 2–3. Makes the flow feel like checkout, not paperwork.

**Don't over-index on:** pixel-matching the operator app. **Do** invest in one hero moment — step 1 header with detailer branding (logo slot in org settings). That's the Expansionist bet: booking pages that convert better become a reason detailers pay for your SaaS and share links proudly.

---

### The Outsider

I got a link that says "Book online" and "Step 2 of 3 — Date & time." I don't know what company this is until I scroll. The green eyebrow text feels like a template, not "Mike's Mobile Detail."

On step 2, I see a date box and a clock box that says "Pick a time" but the times are below in a grid — the clock box is fake/read-only and confused me. I tapped the calendar icon and nothing happened (you said that was buggy). Even fixed, two boxes at the top when only one is interactive is weird.

"Mobile" vs "Fixed" — I don't know what Fixed means. Do I go to their shop? Say "We come to you" / "Drop off at shop."

Vehicle icons are cute but I don't know if picking wrong matters. Five fields on step 3 feels like a job application. I just want to book a car wash.

**What would help me:** bigger business name, one sentence of what I'm booking, price always visible, plain language, fewer fields, obvious "You're done" at the end. I'd trust it more if it looked like a local business page, not a SaaS widget.

---

### The Executor

Monday morning plan, in order:

1. **Fix reliability first (half day):** Kill hydration mismatch on book page — defer all `Date`/locale formatting to client mount; add `suppressHydrationWarning` only where needed. Test date input on real iPhone Safari. Remove the non-interactive clock box on step 2 or make it update when a slot is selected (it's dead UI today).

2. **Sticky summary bar (2–3 hrs):** Footer component: selected package name + price on steps 2–3. Reuse existing state, pure CSS `position: sticky`.

3. **Copy pass (1 hr):** Mobile → "We come to you", Fixed → "Drop-off location", step labels as questions ("What service?" / "When?" / "Your info").

4. **Step 3 field collapse (2 hrs):** Show name, phone, address only. "Add vehicle & notes" expandable section with defaults.

5. **Confirmation upgrade (2 hrs):** CheckCircle hero, formatted date/time, tel link, optional "Add to calendar" `ics` link later.

**Do NOT build:** custom date picker, shared component extraction across QuickAddJob and book page, or settings-driven branding until API exposes logo. Ship the above before any visual refinement.

---

## Peer Review (Anonymized)

**Mapping:** A=Contrarian, B=First Principles, C=Expansionist, D=Outsider, E=Executor

### Reviewer 1
1. **Strongest: D (Outsider)** — Names specific confusion (fake clock box, "Fixed", template feel). Grounded in actual user behavior.
2. **Biggest blind spot: C (Expansionist)** — Merchandising and badges assume detailers will maintain content; most solo operators won't upload photos day one.
3. **All missed:** Accessibility — tap targets, focus order, error messages on invalid phone, and what happens when API is slow on step 2.

### Reviewer 2
1. **Strongest: E (Executor)** — Actionable sequence with time estimates; directly addresses dead clock UI and hydration.
2. **Biggest blind spot: A (Contrarian)** — Dismisses all visual parity too aggressively; some consistency (green CTA, card layout) does signal legitimacy.
3. **All missed:** Bottom nav still visible on book routes — consumers see operator app navigation on a booking link.

### Reviewer 3
1. **Strongest: B (First Principles)** — Reframes from polish to friction removal; "collapse step 3" is the highest-leverage structural change.
2. **Biggest blind spot: D (Outsider)** — Doesn't propose solutions, only problems; less useful for prioritization.
3. **All missed:** Performance — loading packages + slots sequentially; skeleton states vs "Loading…" text.

### Reviewer 4
1. **Strongest: E (Executor)** — Only response with a ship order.
2. **Biggest blind spot: B (First Principles)** — "Feel like Calendly" may conflict with multi-tenant branding needs detailers expect.
3. **All missed:** Error recovery — what user sees when slot taken between select and submit.

### Reviewer 5
1. **Strongest: A (Contrarian)** — Correctly flags operator-app cosplay as risk.
2. **Biggest blind spot: E (Executor)** — Underweights confirmation/trust as conversion factors.
3. **All missed:** Hide or simplify BottomNav on `/book/*` — peer reviewers 2 and 5 noted it independently in synthesis.

---

## Chairman Synthesis

### Where the Council Agrees
- **Stop chasing operator-app visual parity** — light consumer theme is right; more icon/card matching is low ROI.
- **Step 2 clock box is confusing dead UI** — fix or remove before any new polish.
- **Step 3 has too many fields visible at once** — collapse vehicle/location/notes with smart defaults.
- **Trust & clarity beat aesthetics** — business identity, plain language, price visibility, strong confirmation.
- **Reliability before beauty** — hydration, iOS date input, real-device testing.

### Where the Council Clashes
- **Expansionist vs Contrarian on merchandising:** badges, photos, "most popular" — Expansionist sees growth; Contrarian sees empty UI when detailers don't configure content. **Resolution:** build data model hooks only if settings already have the fields; otherwise copy-only badges ("Full Detail — best value") are safe.
- **First Principles vs Executor on scope:** First Principles wants structural simplification (merge steps, Calendary feel); Executor wants incremental shippable slices. **Resolution:** incremental delivery *of* structural wins (collapse fields, sticky summary) not a full step merge.

### Blind Spots the Council Caught
- Bottom nav on booking routes undermines "consumer page" feel.
- Skeleton/loading states are weak ("Loading…" text).
- Accessibility and error states under-specified.
- Slot race condition on submit not addressed.

### The Recommendation
Pursue a **"friction removal + trust"** pass, not a **"visual parity"** pass. Keep the light theme and existing component vocabulary, but:

1. Remove or wire up the step 2 clock display.
2. Add sticky package/price summary on steps 2–3.
3. Rewrite labels for outsiders (location, steps as questions).
4. Collapse step 3 optional fields behind progressive disclosure.
5. Upgrade confirmation screen.
6. Hide BottomNav on `/book/*` (if not already fully hidden).
7. Fix hydration/client-mount for all date/locale rendering.

Defer: custom calendar, package photo merchandising until settings support it, shared QuickAddJob component library.

### The One Thing to Do First
**Remove the fake clock box on step 2** and replace with a single line of selected time that appears only after the user picks a slot — eliminates the #1 outsider confusion point and costs <30 minutes.

---

*Council methodology adapted from Karpathy's LLM Council.*
