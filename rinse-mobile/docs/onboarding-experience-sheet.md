# Rinse Ultimate Onboarding & Experience Sheet

Product psychology playbook for B2C subscription onboarding in Rinse.

**Canonical cheat sheet (global):** [`design-references/ONBOARDING_EXPERIENCE_CHEATSHEET.md`](../detailing-app/design-references/ONBOARDING_EXPERIENCE_CHEATSHEET.md)  
**Cursor rule (always on):** `.cursor/rules/onboarding-experience.mdc`

**Applies to:** `rinse-mobile/` native (source for in-app UX) + PWA parity in `detailing-app/src/components/onboarding/`.

**Last updated:** 2026-07-09

**Note:** This file mirrors the canonical global cheat sheet. Keep both in sync.

**Related:** [transition.md](../detailing-app/docs/transition.md) · [native-design.md](../detailing-app/docs/native-design.md) · [MOTION_SPEC.md](../detailing-app/design-references/MOTION_SPEC.md)

---

## 1. North star

| Question | Rinse answer |
|----------|--------------|
| **Job to be done** | Run my mobile detailing business without juggling texts, spreadsheets, and unpaid invoices. |
| **Aha moment** | Operator sees *their* branded invoice or booking link and thinks: “A client could use this today.” |
| **Activation event** | First job scheduled, first invoice sent, or booking link shared |
| **Trial promise** | 14 days, no card — full operator access, not a crippled demo |
| **What we sell** | Professionalism + getting paid faster — not a feature list |
| **What we’re NOT selling** | Features. We’re selling professionalism + getting paid faster. |

### Current funnel

```
Welcome → Intro → Sign up → Business → Your invoice → Booking → Plans/trial → Product tour → Home
```

**Order rationale:** Endowment (logo, template, link) before ask (trial/plan).

---

## 2. Non-negotiable rules (the 10 rules)

### Do

| Rule | Why | Rinse application |
|------|-----|-------------------|
| Value before ask | Reciprocity | Business + invoice preview before plans sheet |
| Show the path | Reduces anxiety (Mine redesign) | Step labels / progress — eliminate mystery |
| Spark effect | Small yes → big yes | Easy intro slides; one-tap invoice picker |
| Goal gradient | Progress speeds people up | `OnboardingShell` progress; tour = short stops |
| Priming | Frame the job, not features | “Get paid faster” not “CRM + pipeline + inventory” |
| Pre-validated actions | “You’re on the right track” | “Your booking link is ready” / “Invoice looks professional” |
| Peak-end rule | Last screen defines memory | End setup with celebration — not a paywall fight |
| Progressive disclosure | Cognitive load | Tour: Home/Jobs/Clients; defer inventory/reports |
| Neutral dismissals | No sleaze | “Not now” / “Skip tour for now” — never “I don’t want to grow my business” |
| Squint test | One primary action per screen | Each step: one green CTA, everything else muted |

### Don’t (dark patterns & sleaze)

| Anti-pattern | Rinse risk |
|--------------|------------|
| Fake urgency discounts | Trains customers to wait for sales |
| Pre-checked billing | Trial must be explicit opt-in |
| Confirmshaming | “I don’t want to get paid” on dismiss |
| Churn friction | Long cancel survey with no follow-up |
| Six asks in a row | Permissions before value |
| Banner blindness | Trial pill + banner + paywall + tour at once |

**Discount policy:** Anchor at **$12/mo** honestly. Justify discounts (founding, annual, referral) — never random “limited time” without reason. Unjustified discounts lower brand perception long-term (**Sleazy Salesman Effect**).

---

## 3. Psychology → screen map

### Welcome (`WelcomeScreen`)

| Principle | Apply |
|-----------|--------|
| **JTBD framing** | “Book clients. Send invoices. Get paid.” |
| **Priming** | One visual (phone + invoice/calendar), not feature grid |
| **Spark** | “Get started” primary; Sign in secondary |
| **Squint** | Logo, headline, one CTA |

**Avoid:** Listing many features on one screen (Loom cognitive-load lesson — don’t show 10 features).

### Intro (`IntroFlow`)

| Principle | Apply |
|-----------|--------|
| **Yes ladder** | 2–3 slides users *agree* with: “Clients ghost you?” → “You deserve a booking link” |
| **Curiosity gap** | “Next: set up in under 2 minutes” |
| **Write with an eraser** | Max ~12 words per slide body |

**Mine lesson:** Story slides work if short. Cut if it feels like “story time again.”

### Auth (signup/login)

| Principle | Apply |
|-----------|--------|
| **Spark** | Prefer one-tap sign-in (Apple/Google) when available |
| **Labor illusion** | Brief “Setting up your workspace…” post-signup (1–2s feels custom) |
| **Showing path** | “Step 1 of 4: Business basics” immediately after auth |

**SparkLoop lesson:** Post-opt-in clarity — user should know what happens in the next 60 seconds.

### Step 1 — Business (`OnboardingBusinessStep`)

| Principle | Apply |
|-----------|--------|
| **Endowment** | “Your business” language; logo upload = “this is mine” |
| **Reciprocity** | Build *their* brand before asking for trial |
| **Cognitive load** | Only go-live fields (name, phone, logo) — defer tax ID, etc. |

**Mine pattern (backlog):** “3 steps to go live” card on Step 1 (path forward).

### Step 2 — Your invoice (`OnboardingYourInvoiceStep`) — ⭐ AHA ZONE

| Principle | Apply |
|-----------|--------|
| **Aha moment** | Live preview with *their* name, accent, package |
| **Peak** | `AccountReadyCelebration` — emotional high |
| **Endowment** | “Your invoice” not “Pick a template” |
| **Pre-validation** | “This is what clients will see” + checkmark |

**Headspace lesson:** Personalized output beats generic feature tour.

**Backlog:** Reframe headline: “This is what your clients see” (priming + aha).

### Step 3 — Booking (`OnboardingBookingStep`)

| Principle | Apply |
|-----------|--------|
| **Temptation bundling** | “Share this link → clients book while you’re on a job” |
| **Spark** | Copy link = one tap; don’t force share sheet yet |
| **Curiosity** | Optional: “See what clients see” opens book preview |

### Step 4 — Plans (`OnboardingPlansSheet`)

| Principle | Apply |
|-----------|--------|
| **Status quo bias** | Default path = **Start free trial** (primary), Subscribe secondary |
| **No dark defaults** | Trial is explicit; no hidden charge |
| **Anchoring** | $12/mo stated clearly — no fake “was $29” unless true |
| **Peak-end** | End with “You’re ready” + into home — not trapped in sheet |
| **Personalized paywall** | Recap setup → map features → trial CTA (Grammarly +10%) |

**Trial in-app:** `TrialPlanBadge` pill only. Don’t duplicate with a second banner unless ≤3 days left.

**Backlog path copy:** “Trial → Add job → Send invoice → Subscribe when ready.”

### Product tour (`ProductTour` + `TourWelcomeModal`)

| Principle | Apply |
|-----------|--------|
| **Progressive disclosure** | 6 stops max; skip inventory/tools |
| **Self-initiated** | “Start tour” / “Skip for now” — user chooses |
| **Goal gradient** | “3 of 6” dots |
| **Peak-end** | Last stop: “You’re set — add your first job” with FAB highlight |

**Loom lesson:** Don’t show 13 CTAs on one screen. Tour = one spotlight, one message.

---

## 4. Loading = opportunity

| Moment | Instead of spinner |
|--------|-------------------|
| Post-signup | “Creating your workspace…” + tip: “Most detailers send their first invoice in week 1” |
| Package load | Skeleton invoice preview, not blank |
| PocketBase save | Optimistic UI + haptic “Saved” |
| Trial check | Don’t block home; badge when ready |

Spinners add uncertainty. Use loading time to prime value or explain the next step.

---

## 5. Trial & paywall ethics

| Checkpoint | Expected |
|------------|----------|
| Trial days visible (no NaN) | Yes |
| Gate premium actions, allow browse | Yes |
| Paywall explains feature blocked | Yes |
| Nudge dismissible per action (≤3 days left) | Yes |
| Lapsed = pill + sheet, not hostage UI | Yes |
| Empathetic cancel/offboarding | Build when self-serve cancel ships |

**Nudge timing:** ≤3 days left = paywall on premium actions. Don’t nag on day 1.

---

## 6. Offboarding (when built)

**Avoid:**

- Long form + no visible action taken
- Discount trap on every exit
- Hidden cancel behind 5 screens

**Prefer:**

1. Optional one-tap reason
2. Honest “what you’ll lose” (booking link, client history) — honest, not scary
3. Pause trial / export data / “Come back anytime”
4. Warm goodbye (peak-end)

Offboarding empathy: forcing feedback without showing you listened is worse than not asking.

---

## 7. Reference inspirations

| Source | Steal | Skip |
|--------|-------|------|
| [Mine](https://growth.design) (trial conversion) | Yes ladder, interactive guess, 3-step path on signup, “effortless” framing | Fake “you guessed right” validation |
| Loom (onboarding) | End-of-value reciprocity (pre-filled thank-you), smart defaults (1.2x = status quo bias), clean viewing UI | 13 CTAs on one page |
| [SparkLoop](https://sparkloop.app/) | Clear post-opt-in path, quality-over-quantity messaging | Newsletter-specific widgets |
| [HomeExchange](https://www.homeexchange.com/) | Calm typography, trust, spacious cards | Travel-specific flows |
| [Setgreet](https://www.setgreet.com/) | Native permission prompts with *why*; remote iteration of copy | Full 3rd-party SDK for core funnel |
| [Grammarly](https://growth.design/case-studies/grammarly-onboarding-survey) | Personalized paywall (+10%), framing “skip personalization”, goal → feature mapping | Redundant post-pay surveys; generic profile after personalization |
| Hopper (Growth.Design) | Progressive disclosure (Where from? → Where to?); user-driven permission prompts | System prompts before user intent |
| Headspace (Growth.Design) | Personalized output beats generic feature tour | — |
| Email capture / design blunders (Growth.Design) | Priming, contrast, no shame dismiss | — |

**Setgreet insight:** You don’t need their SDK — build flows in code, but keep copy/targeting in a doc or remote config you can A/B without App Store review (feature flags for **copy only**).

---

## 8. Per-screen audit (print this — ship at ≥16/20)

Score 0–2 each:

| # | Check | 0 | 1 | 2 |
|---|-------|---|---|---|
| 1 | **Squint test** — one obvious CTA? | | | |
| 2 | **≤1 primary decision** | | | |
| 3 | **Value given before ask** | | | |
| 4 | **Copy ≤2 short paragraphs** | | | |
| 5 | **Progress visible** (step X of Y) | | | |
| 6 | **Error states human** (not “Failed”) | | | |
| 7 | **Dismiss is neutral** (no shame) | | | |
| 8 | **Contrast** — CTA pops on scrim | | | |
| 9 | **Reduced motion fallback** | | | |
| 10 | **Maps to activation metric** | | | |

**Ship threshold:** ≥16/20 per screen.

---

## 9. Metrics

| Stage | Metric | Target intuition |
|-------|--------|------------------|
| Welcome → Signup | Click-through | >40% |
| Signup → Step 1 complete | Activation start | >80% |
| Step 2 celebration viewed | Aha reached | >70% |
| Booking link copied | Setup value | >50% |
| Trial started (complete onboarding) | Trial conversion | >60% |
| Tour started | Engagement | >30% (optional is fine) |
| D1: first job OR invoice | **True activation** | >25% |
| D7 retention | Habit | >40% |
| Trial → paid | Revenue | Benchmark after 100 users |

**Events to instrument:** `onboarding_step_completed`, `booking_link_copied`, `first_job_created`, `first_invoice_sent`, `trial_started`, `tour_completed`.

---

## 10. One-pager (tape to monitor)

```
JOB:     Solo detailer gets paid without chaos
AHA:     Their invoice / booking link, live, with their name on it
ORDER:   Brand → Preview → Link → Trial → Tour → Work

BEFORE EVERY SCREEN:
  □ One CTA?  □ Value first?  □ ≤3 decisions?  □ Squint pass?

NEVER:
  □ Fake discounts  □ Shame dismiss  □ 6 permission asks  □ Churn hostage
  □ Banner blindness (pill + banner + paywall + tour at once)
  □ Unclear personalization  □ Duplicate questions (Conway seams)

ALWAYS:
  □ Progress visible  □ Pre-validate  □ Peak moment (invoice)  □ Warm exit
  □ Frame trial as keeping what they built  □ User-driven permissions

TRIAL:
  □ Pill not banner  □ Gate actions not browsing  □ $12 honest anchor
```

---

## 11. Principles glossary (full)

| Principle | One line | Rinse hook |
|-----------|----------|------------|
| **Aha moment** | First time user feels real value | Invoice preview + celebration |
| **Spark effect** | Small effort → more likely to act | 2 intro slides, one-tap template, copy link |
| **Yes ladder** | Small yeses build toward bigger ask | Intro slides → signup → setup |
| **Goal gradient** | Closer to finish → faster they move | `OnboardingShell` progress, tour dots |
| **Peak-end rule** | Peaks + ending define memory | Celebration at invoice; warm home entry |
| **Endowment** | “Mine” feels more valuable | Logo, “Your invoice”, “Your booking link” |
| **Reciprocity** | Give value before asking; if they give info, show you used it | Echo their inputs immediately |
| **Priming** | Subtle visuals/context shape later decisions | Car, invoice, calendar — not SaaS grid |
| **Cognitive load** | Fewer decisions, numbers, and words | ≤12 words/slide, one CTA/screen |
| **Information overload** | Too many inputs → worse decisions, abandonment | One question/screen; collapse “Learn more” |
| **Progressive disclosure** | Simple actions first, complexity later | Onboarding → jobs/clients; defer inventory |
| **User-driven prompt** | User triggers permission/info ask via intent | Permissions on tap, not on launch |
| **Framing effect** | How you label an action changes its perceived value | “Skip tour for now” not “Skip” |
| **Personalization clarity** | Personalization must be *visible* or it feels fake | Highlight name, role, goals in copy |
| **Personalized paywall** | Goals → features → upgrade path (3 steps) | +10% Grammarly pattern on Plans sheet |
| **Conway’s Law** | Org team seams show up as UX seams | One funnel owner; no duplicate collects |
| **Loss aversion** | Real stakes motivate; fake loss → ignored forever | Post-activation only; booking link offline |
| **Status quo bias** | Defaults matter — use ethically | Trial primary; Loom 1.2x-style smart defaults |
| **Aesthetic usability** | Good looks feel more capable | Polished invoice mock = trust |
| **Curiosity gap** | Incomplete info pulls engagement | “Next: set up in under 2 minutes” |
| **Labor illusion** | Brief “crafting” raises perceived value | “Setting up your workspace…” 1–2s |
| **Pre-validated action** | Confirm they’re on the right track | “Your booking link is ready” |
| **Temptation bundling** | Pair want + should | “Clients book while you’re on a job” |
| **Write with an eraser** | Cut copy ruthlessly | ~12 words per intro slide body |
| **Self-initiated** | User chooses when to engage | Tour: Start / Skip for now |
| **Sleazy Salesman Effect** | Unjustified discounts hurt brand long-term | $12 honest anchor; reason every discount |
| **Technology to help us** | Products should make life better, not maximize engagement | Ethical nudges only; no nag-for-nag’s-sake |

---

## 12. Deep principles (Hopper · Grammarly · habits)

Expanded notes from Growth.Design case studies. Each principle includes **what it is**, **why it works**, and **how Rinse should apply it**.

### Spark effect

**What:** We are more likely to take action when the effort is small.

**Example:** Pavlock’s tiny swipe to start a routine still commits the user to the rest of the flow — micro-actions build momentum.

**Rinse apply:**

| Moment | Spark action |
|--------|----------------|
| Intro | Swipe/tap through 2 slides (not 6) |
| Business step | Logo upload optional; name + phone only required |
| Invoice step | One-tap template pick; celebration on continue |
| Booking | “Copy link” single tap |
| Tour | “Next” per stop — never a wall of text |
| Home D1 | “+ Add job” as smallest path to activation |

**Rule:** If a step feels like “work,” split it or defer it. First action should take &lt;10 seconds.

---

### Loss aversion

**What:** We hate losing what we have earned. Leveraging loss aversion can create desired behaviors — but it needs to be a **real** loss. Otherwise, people reject it and ignore it forever.

**Example:** Sleep apps that frame “you’ll lose your streak / optimal sleep window” work when the user has actually built something worth keeping.

**Rinse apply (ethical only):**

| ✅ Real loss to frame | ❌ Fake loss (ignore + distrust) |
|----------------------|----------------------------------|
| “Your booking link goes offline” (trial lapsed) | “You’ll lose 50% off forever!” |
| “Clients can’t book after trial ends” | Countdown timers with no real deadline |
| “Unsent invoices stuck in draft” | “Only 2 spots left” |

**Habit angle:** After activation (first job/invoice), streak-style nudges (“3-day booking streak”) are OK only once the user has earned the streak. Don’t threaten loss before they have something to lose.

**Checklist:** See `habit-building-checklist.pdf` — use loss framing post-activation, not pre-aha.

---

### Priming

**What:** Priming consists of subtle visuals that influence how we respond.

**Example:** Hopper’s friendly airport/travel landscape lets users dream about their next trip — increasing chances of a positive experience.

**Rinse apply:**

| Screen | Prime with |
|--------|------------|
| Welcome | Clean car, professional invoice, calendar with jobs — not generic SaaS |
| Intro | “Clients book while you work” scene |
| Invoice celebration | Their logo on a polished invoice mock |
| Booking step | Phone showing client picking a time slot |
| Plans sheet | Green checkmarks on what trial unlocks (jobs, invoices, link) |

**Rule:** Every onboarding screen should answer “what world am I entering?” before “what do I click?”

---

### Progressive disclosure

**What:** Encouraging users to move from completing simple actions to executing more complex ones lowers the chances they feel overwhelmed.

**Example:** Hopper offers simple actions to start with: Where from? And where to?

**Rinse apply:**

```
Onboarding:     name → preview → link → trial     (not settings deep-dive)
First week:     jobs, clients, invoices            (not inventory, reports, pipeline)
Tour:           6 overview stops                   (not every tab)
Settings:       defer tax, overhead, packages      until post-activation
```

**Hopper lesson:** One field group per screen beats one long form.

---

### User-driven prompts

**What:** If you need information or private access early in the product experience, implement ways where the user deliberately triggers the prompt. When actions are driven by user intent, the experience feels more natural — hence better conversion.

**Example:** Hopper requests location/notifications when the user searches a route or sets a price alert — not on first open.

**Rinse apply:**

| Permission / data | Trigger on user action |
|-------------------|------------------------|
| Notifications | After first job scheduled: “Remind you before this job?” |
| Photo library | When user taps “Add damage photo” |
| Contacts | When user taps “Import clients” (if ever) |
| Location | When user taps “Open in Maps” on a job |

**Never:** Push permission sheet on home load or mid-onboarding before aha.

**Checklist:** See `hopper-permission-requests-checklist.pdf`.

---

### Information overload

**What:** Information overload occurs when the amount of input to a system exceeds its processing capacity, often resulting in a reduction in decision quality.

**Signals in Rinse to watch:**

- Business step with too many optional fields visible at once
- Plans sheet with full feature list + trial copy + two CTAs + error state
- Tour modal + trial pill + quick actions open simultaneously
- Paywall that lists every premium action instead of the one blocked

**Fix pattern:**

1. One primary question per screen
2. Collapse secondary info behind “Learn more”
3. Default smart choices (template, accent, first package)
4. Squint test — blur vision; only CTA + headline should pop

---

### Framing effect

**What:** The way you present information affects how people make decisions.

**Example:** Grammarly reframed skipping questions as **“Skip personalization”** to make users value every step more. They also use the Spark Effect by asking short and simple questions first to get users engaged from the start.

**Rinse apply:**

| Weak frame | Strong frame |
|------------|--------------|
| “Skip” | “Skip tour for now” |
| “Dismiss” | “Not now” |
| “Subscribe” | “Keep sending invoices after trial” |
| “Start trial” | “Start 14-day trial — no card” |
| “Skip setup” | “Skip booking link setup” (specific) |

**Plans sheet:** Frame trial as *keeping* what they built (invoice + link), not buying abstract “Starter.”

---

### Personalization clarity

**What:** People prefer personalized experiences. Interestingly, Grammarly does customize goals based on previous answers — but that’s unclear, and personalization that’s poorly communicated can be worse than no personalization at all.

**Grammarly failure mode:** Goal pills look generic even when answers customize them. Users don’t feel heard.

**Grammarly fix:** Highlight dynamic text: “People in your situation (**Leaders**, **2–20 employees**) typically want…”

**Rinse apply:**

If you add onboarding questions (optional future), always **show the echo**:

```
You said: mobile detailing, solo operator
→ We set up a booking link and invoice template for solo mobile jobs.
```

**Today without a survey:** Personalization comes from *their data* — business name, logo, accent on invoice preview. **Label it:**

- “Your invoice” not “Invoice template”
- “Your booking link” not “Public URL”
- “{BusinessName} is ready” on celebration screen

**Rule:** If the UI uses their inputs, say so explicitly in copy.

---

### Personalized paywall

**What:** Upgrade rates increased by **10%+** when Grammarly tested this paywall.

**The 3-step experiment:**

1. **Show you understand their goals** (recap what they said)
2. **Show features that map to those goals** (arrows from goal → feature)
3. **Show a personalized path to upgrade** (“Based on your answers, we recommend…”)

**Rinse adaptation (Plans sheet / paywall):**

```
Step 1 — Recap value already built:
  “You set up {BusinessName} with a booking link and invoice.”

Step 2 — Map goals → features (even without a survey, infer from setup):
  “Keep booking online” → booking link
  “Get paid professionally” → invoices + portal
  “Run jobs from your phone” → schedule + clients

Step 3 — Path:
  “Start free trial to keep all of this” (primary)
  “Subscribe now — $12/mo” (secondary)
```

**Paywall when lapsed:** Reference the *specific action blocked* (`Sending invoices requires an active subscription`) — already in `PaywallGateProvider`. Add goal tie-in: “Subscribe to keep sending invoices to clients.”

**Checklist:** See `grammarly-onboarding-survey-cheat-sheet.pdf`.

---

### Conway’s Law

**What:** The structure of an organization is reflected in the products it creates.

**Grammarly failure mode:**

- Survey team builds personalization questionnaire
- Growth team builds generic plan comparison (“Hmm… a random upsell?”)
- Account team dumps user on Profile page (“my Profile… yay.”)
- Business team re-asks the same team-size questions after payment (“Wait.. didn’t I already answer most of these earlier?”)

Result: redundant questions, tone shifts, post-pay letdown. Grammarly’s fix: replace post-payment welcome + redundant survey + generic profile with **one** personalized “3 ways to get started” screen based on survey answers.

**Rinse guardrails:**

| Seam risk | Prevention |
|-----------|------------|
| Web signup vs native onboarding | Same 4 steps, same copy, same order — single source in `onboarding.ts` + shared labels |
| Plans sheet vs settings billing | Same `STARTER_PLAN` from `plans.ts`; same price |
| Tour vs onboarding | Tour never re-asks what setup already collected |
| Paywall vs onboarding plans | Same sheet component / copy patterns |
| PWA vs native | `native-pwa-parity.md` audit before ship |

**Rule:** One funnel owner. Any new step must answer: “Did we already collect this?”

---

### Reciprocity principle

**What:** When users give, they expect to get. Onboarding questionnaires work, but they also increase user expectations. So show your customers you listen to their needs as early as possible.

**Grammarly lesson:** Questionnaires work, but they **raise expectations**. Follow with obvious proof you listened.

**Rinse reciprocity map:**

| User gives | Rinse gives back (immediately) |
|------------|-------------------------------|
| Email + password | Workspace + step 1 ready |
| Business name + phone | Branded shell, logo slot |
| Template pick | Live invoice preview with their name |
| Completing setup | Booking link + trial + tour offer |
| 14-day trial | Full product, not crippled tier |

**Failure mode:** Ask 5 setup questions → drop on generic home with no reflection of answers → feels like a bait-and-switch.

**Fix:** Celebration screens, personalized headlines, and post-setup **“3 ways to start”** cards (Grammarly’s redesigned ending) tied to what they configured:

- Style guide → “Setup writing style guide”
- Brand tone → “Create a brand voice or tone”
- Writing quality → “Revise or rewrite text”

(Rinse equivalents: first job, send invoice, share booking link.)

---

### Technology to help us (habits)

**What:** Apple CEO Tim Cook: “We made the phone not so you’d use it all the time, we made the phone to make your life better.”

**Rinse apply:** Onboarding and habit nudges should help detailers get paid and stay organized — not maximize time-in-app. Ethical loss framing, reminders before jobs, and activation prompts are fine; engagement bait is not.

---

## 13. Grammarly & Hopper — do’s and don’ts (merged)

### 5 Do’s and Don’ts for User Onboarding Surveys (Grammarly case study)

1. ✨ Start by asking users **[simple]** questions (spark effect)
2. 💚 Highlight how your questions will **[benefit]** your users (framing / reciprocity)
3. 🎯 Show you care by asking about your user's **[goals]** early (personalization clarity)
4. 👂 Personalize future questions by using previous **[answers]** (reciprocity)
5. 🏢 Conway's Law: Avoid onboarding gaps caused by **[team]** gaps — one funnel, no duplicate questions

### Permissions (Hopper)

1. Trigger on **user intent**, not app launch
2. Explain **why** in the moment (“Get reminded before jobs”)
3. Offer **“Not now”** without shame
4. Never stack permissions back-to-back

### Paywall (Grammarly)

1. Recap goals or setup completed
2. Map features to those goals visually (arrows from goals → features)
3. Recommend one clear path (trial primary)
4. Don’t interrupt aha with upsell — plans come **after** invoice + link
5. Make personalization obvious: “Based on your answers, we recommend…” / “Covers the 3 goals you mentioned”

### Habits (post-activation)

1. Loss framing only after streak/value exists (`habit-building-checklist.pdf`)
2. Small spark actions to start routines (Pavlock swipe pattern)
3. Technology serves life — don’t nag for engagement’s sake (Tim Cook)

---

## 14. Priority backlog

1. Reframe Step 2 headline: “This is what your clients see”
2. “3 steps to go live” on Step 1 (path forward — Mine pattern)
3. Post-signup loading tips during workspace setup
4. Tour last stop → “Add your first job” + FAB ring
5. Plans sheet: **personalized paywall** — recap setup → map features → trial CTA
6. Plans sheet: trial primary + path copy (trial → job → invoice → subscribe)
7. Single trial UI (pill; banner only ≤3 days)
8. Framing pass: replace generic “Skip” with specific neutral dismiss copy
9. Permission audit: user-driven triggers only (Hopper checklist)
10. Conway audit: no duplicate data collection across web/native/settings
11. Analytics events for funnel stages
12. Post-setup “3 ways to start” cards (Grammarly ending pattern)

---

## 15. Code owners

| Area | Path |
|------|------|
| Funnel router | `rinse-mobile/app/onboarding/index.tsx` |
| Welcome / intro | `rinse-mobile/app/welcome.tsx`, `app/intro.tsx` |
| Steps | `rinse-mobile/src/components/onboarding/*` |
| Shell + progress | `OnboardingShell.tsx` |
| Tour | `rinse-mobile/src/components/ProductTour.tsx` |
| Trial / paywall | `rinse-mobile/src/providers/PaywallGateProvider.tsx` |
| Trial pill | `rinse-mobile/src/components/subscription/TrialPlanBadge.tsx` |
| Subscription gates | `rinse-mobile/src/lib/subscription-gates.ts` |
| PWA reference | `detailing-app/src/components/onboarding/*` |
| Shared plans | `*/src/lib/plans.ts` |

---

## 16. Marketing vs product (personal site, not Framer)

**Decision:** Rinse marketing lives on **your personal site** — not Framer, not a separate no-code builder.

For **Rinse onboarding inside the app**: stay native / Next.js — psychology only works if the aha is *real* (live invoice, real booking link), not a mockup on a landing page.

| Surface | Recommendation |
|---------|----------------|
| Rinse marketing / waitlist | **Personal site** → CTA into app (`rinsehq.com` signup / trial) |
| Rinse SaaS (`rinsehq.com`) | Next.js — auth, billing, onboarding, parity with native |
| Operator full website | `detailing-website` (Next.js + booking API) |
| Operator link-in-bio only | Carrd or similar → `/book/{slug}` (optional for operators) |

**Practical split:**

```
Rinse marketing              → Personal site (you own it)
Rinse SaaS (rinsehq.com)     → Next.js (what you have)
Operator full website        → detailing-website (Next.js + API)
Operator “just need a link”  → Carrd → /book/{slug} (their choice)
In-app onboarding            → rinse-mobile / detailing-app (real aha only)
```

**Onboarding psychology note:** Landing pages can prime and drive signup, but the aha moment must happen **in the app** with their real invoice and booking link.

---

## Further reading

### Canonical (global)

- **[`ONBOARDING_EXPERIENCE_CHEATSHEET.md`](../detailing-app/design-references/ONBOARDING_EXPERIENCE_CHEATSHEET.md)** — master cheat sheet (principles, funnel, audit, metrics)

### Growth.Design case studies

- [Grammarly onboarding survey](https://growth.design/case-studies/grammarly-onboarding-survey) — personalized paywall, framing, Conway’s Law
- Mine trial conversion — yes ladder, path forward
- Loom onboarding — cognitive load, reciprocity, peak-end
- Hopper — progressive disclosure, user-driven permissions
- Email capture / design blunders — priming, contrast, no shame dismiss

### Local checklists (user research)

- `grammarly-onboarding-survey-cheat-sheet.pdf`
- `hopper-permission-requests-checklist.pdf`
- `habit-building-checklist.pdf`
- `psychology-cheat-sheet.pdf`
- `landing-page-ux-checklist.pdf`
- `headspace-user-onboarding-checklist.pdf`
- `trial-conversion-checklist.pdf`
- `user-offboarding-checklist.pdf`

### Repo docs

- `design-references/ONBOARDING_MOCKUP_CLAUDE_PROMPT.md` — Claude prompt for onboarding + personal-site mockups
- `design-references/MOTION_SPEC.md` — motion archetypes for sheets and celebration
- `docs/transition.md` — native onboarding + App Store 3.1.1 notes
- `docs/native-pwa-parity.md` — parity checklist
