import { notifyBusinessUpdated } from "@/lib/business-brand"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { RinseLogo } from "@/components/brand/RinseLogo"
import { Field, TextInput } from "@/components/settings/primitives"
import { useAuth } from "@/providers/AuthProvider"
import {
  loadDesktopSetup,
  requiresDesktopSetup,
  saveDesktopSetup,
  setupStep,
  SETUP_STEPS,
  type BusinessBasics,
  type DesktopSetup,
} from "@/lib/desktop-onboarding"
import {
  fetchOrgSubscription,
  isSubscriptionActive,
  type OrgSubscription,
} from "@/lib/subscription"
import {
  loadPricingOffer,
  startDesktopCheckout,
  type PricingOffer,
} from "@/lib/billing-checkout"
import { FREE_PLAN, STARTER_PLAN } from "../../../../packages/core/src/pricing"

const primary =
  "rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
const secondary =
  "rounded-xl border border-ink-200 px-5 py-3 font-semibold text-ink-700 disabled:opacity-50"
export type SetupDestination = "dashboard" | "calendar" | "tour"
export function DesktopOnboardingGate({
  children,
}: {
  children: (destination: SetupDestination) => ReactNode
}) {
  const { signOut } = useAuth()
  const [state, setState] = useState<DesktopSetup | null>(null)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const [destination, setDestination] = useState<SetupDestination>("dashboard")
  useEffect(() => {
    let alive = true
    setError("")
    // #region agent log
    fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'pre-fix',hypothesisId:'H5',location:'DesktopOnboardingGate.tsx:useEffect',message:'loadDesktopSetup start',data:{retry},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    void loadDesktopSetup()
      .then((value) => {
        // #region agent log
        fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'pre-fix',hypothesisId:'H2',location:'DesktopOnboardingGate.tsx:then',message:'loadDesktopSetup success',data:{enabled:value.enabled,eligible:value.eligible,hasCompleted:!!value.completedAt},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        if (alive) setState(value)
      })
      .catch((err: unknown) => {
        // #region agent log
        fetch('http://127.0.0.1:7479/ingest/b8b91f35-a35e-496d-9234-45074f0471db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'496ba6'},body:JSON.stringify({sessionId:'496ba6',runId:'pre-fix',hypothesisId:'H1',location:'DesktopOnboardingGate.tsx:catch',message:'loadDesktopSetup failed',data:{errorMessage:err instanceof Error?err.message:String(err),errorName:err instanceof Error?err.name:'unknown'},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        if (alive)
          setError("Could not load setup. Check your connection and retry.")
      })
    const start = () => {
      setState(null)
      void saveDesktopSetup({ action: "start" })
        .then((value) => {
          if (alive) setState(value)
        })
        .catch(() => {
          if (alive) setError("Could not open setup. Please retry.")
        })
    }
    window.addEventListener("desktop-setup-open", start)
    return () => {
      alive = false
      window.removeEventListener("desktop-setup-open", start)
    }
  }, [retry])
  if (!state)
    return (
      <main className="min-h-screen bg-gray-50 grid place-items-center p-8">
        <div className="space-y-5 text-center">
          <RinseLogo size={40} />
          <p role={error ? "alert" : "status"}>
            {error || "Loading your workspace…"}
          </p>
          {error && (
            <button className={primary} onClick={() => setRetry((n) => n + 1)}>
              Retry
            </button>
          )}
          <button
            className="block mx-auto text-sm underline"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </main>
    )
  if (!requiresDesktopSetup(state)) return children(destination)
  return (
    <DesktopOnboardingFlow
      initial={state}
      onDone={(value, target) => {
        setDestination(target)
        setState(value)
      }}
    />
  )
}

function DesktopOnboardingFlow({
  initial,
  onDone,
}: {
  initial: DesktopSetup
  onDone: (state: DesktopSetup, destination: SetupDestination) => void
}) {
  const { signOut } = useAuth()
  const [state, setState] = useState(initial)
  const [step, setStep] = useState(setupStep(initial))
  const [business, setBusiness] = useState<BusinessBasics>(() => ({
    ...initial.business!,
    timezone:
      initial.business?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  }))
  const [org, setOrg] = useState<OrgSubscription | null>(null)
  const [pricing, setPricing] = useState<PricingOffer | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [serviceName, setServiceName] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [clientName, setClientName] = useState("")
  const [addService, setAddService] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(() =>
    new URLSearchParams(window.location.search).get("desktop_billing"),
  )
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    heading.current?.focus()
  }, [step])
  async function refreshPlan() {
    const [subscription, offer] = await Promise.all([
      fetchOrgSubscription(true, true),
      loadPricingOffer(),
    ])
    if (!mounted.current) return
    setOrg(subscription)
    setPricing(offer)
    if (subscription && isSubscriptionActive(subscription))
      setPaymentStatus("confirmed")
  }
  useEffect(() => {
    void refreshPlan().catch(() => {
      if (mounted.current)
        setError(
          "Could not check your plan. You can retry or continue with Free.",
        )
    })
    if (paymentStatus !== "success") return
    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      void refreshPlan().catch(() => {})
      if (attempts >= 10) window.clearInterval(interval)
    }, 3000)
    return () => window.clearInterval(interval)
  }, [paymentStatus])
  const paid = !!org && isSubscriptionActive(org)
  async function run(task: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await task()
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Please retry.")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  async function save(action: Record<string, unknown>) {
    const next = await saveDesktopSetup(action)
    if (!next.enabled) {
      onDone(next, "dashboard")
      return next
    }
    if (mounted.current) {
      setState(next)
      setStep(setupStep(next))
    }
    return next
  }
  function textField(key: keyof BusinessBasics, label: string, type = "text") {
    return (
      <Field key={key} htmlFor={`setup-${key}`} label={label}>
        <TextInput
          id={`setup-${key}`}
          type={type}
          value={business[key]}
          onChange={(value) =>
            setBusiness((current) => ({ ...current, [key]: value }))
          }
        />
      </Field>
    )
  }
  async function finish(target: SetupDestination) {
    const next = await saveDesktopSetup({ action: "complete" })
    const url = new URL(window.location.href)
    url.searchParams.delete("desktop_billing")
    window.history.replaceState(null, "", url)
    if (mounted.current) onDone(next, target)
  }
  return (
    <main className="min-h-screen bg-gray-50 text-ink-900 p-5 sm:p-10">
      <header className="mx-auto max-w-5xl flex items-center justify-between">
        <RinseLogo size={40} />
        <button
          className="text-sm text-ink-500 underline"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </header>
      <div className="mx-auto max-w-5xl mt-10 grid gap-10 md:grid-cols-[200px_1fr]">
        <nav aria-label="Setup progress">
          <p className="text-sm text-ink-500 mb-5">YOUR WORKSPACE</p>
          <ol className="space-y-5">
            {SETUP_STEPS.map((label, index) => (
              <li key={label}>
                <button
                  disabled={busy || index > setupStep(state)}
                  aria-current={step === index ? "step" : undefined}
                  onClick={() => setStep(index)}
                  className={`text-left disabled:opacity-40 ${
                    step === index
                      ? "font-semibold text-brand-700"
                      : "text-ink-500"
                  }`}
                >
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
          <p className="text-xs text-ink-500 mt-8">
            Your progress saves as you go.
          </p>
        </nav>
        <section
          className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-9 space-y-6"
          aria-busy={busy}
        >
          <p className="text-sm text-ink-500">Step {step + 1} of 4</p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-2xl font-semibold outline-none"
          >
            {step === 0
              ? "Choose how you get started"
              : step === 1
                ? "Make this your business"
                : step === 2
                  ? "Prepare for your first job"
                  : `${business.business_name} is ready`}
          </h1>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}
          {step === 0 && (
            <>
              <p className="text-ink-500">
                Organize your jobs and get paid. Start free, or unlock more
                tools today.
              </p>
              {paymentStatus && (
                <p role="status" className="rounded-xl bg-gray-50 p-4">
                  {paymentStatus === "confirmed"
                    ? "Your paid plan is active. Unlimited active jobs are included."
                    : paymentStatus === "cancel"
                      ? "Checkout was canceled. Continue with Free or try again."
                      : "Waiting for payment confirmation. You can retry the check or continue on Free while it processes."}
                </p>
              )}
              {paid ? (
                <>
                  <p className="font-semibold">
                    {org?.plan === "founding"
                      ? "Founding · lifetime Starter"
                      : "Starter access"}{" "}
                    · Unlimited active jobs
                  </p>
                  <button
                    disabled={busy}
                    className={primary}
                    onClick={() =>
                      void run(async () => {
                        await save({ action: "plan", choice: "paid" })
                      })
                    }
                  >
                    Continue with your plan
                  </button>
                </>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-ink-200 p-5 space-y-4">
                    <h2 className="font-semibold">Free · $0</h2>
                    <ul className="space-y-2 text-sm text-ink-600">
                      {FREE_PLAN.features.slice(0, 4).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-ink-500">
                      No card required. No trial.
                    </p>
                    <button
                      disabled={busy}
                      className={secondary}
                      onClick={() =>
                        void run(async () => {
                          await save({ action: "plan", choice: "free" })
                        })
                      }
                    >
                      Continue with Free
                    </button>
                  </div>
                  <div className="rounded-xl border border-brand-200 p-5 space-y-4">
                    <h2 className="font-semibold">
                      Starter ·{" "}
                      {pricing
                        ? pricing.offer === "early"
                          ? pricing.early.priceLabel
                          : pricing.starter.priceLabel
                        : STARTER_PLAN.priceLabel}
                    </h2>
                    <ul className="space-y-2 text-sm text-ink-600">
                      <li>Unlimited active jobs</li>
                      <li>Online booking and client portal</li>
                      <li>Quotes, inventory and profit reports</li>
                    </ul>
                    {pricing?.offer === "early" && (
                      <p className="text-xs text-ink-500">
                        Early pricing while continuously subscribed. Checkout
                        confirms eligibility.
                      </p>
                    )}
                    <button
                      disabled={busy || !org || !pricing}
                      className={primary}
                      onClick={() => void run(startDesktopCheckout)}
                    >
                      Upgrade to Starter
                    </button>
                  </div>
                </div>
              )}
              <button
                disabled={busy}
                className="text-sm underline text-ink-500"
                onClick={() => void run(refreshPlan)}
              >
                Refresh plan and pricing
              </button>
            </>
          )}
          {step === 1 && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                void run(async () => {
                  await save({ action: "business", business })
                  notifyBusinessUpdated(business.business_name)
                })
              }}
            >
              <p className="text-ink-500">
                Confirm your business name and timezone. You can update these
                later in Settings.
              </p>
              {textField("business_name", "Business name")}
              {textField(
                "timezone",
                "Timezone (for example, America/New_York)",
              )}
              <details>
                <summary className="cursor-pointer text-sm text-ink-600">
                  Contact details (optional)
                </summary>
                <div className="space-y-4 mt-4">
                  {textField("business_phone", "Phone", "tel")}
                  {textField("business_email", "Email", "email")}
                  {textField("business_address", "Address")}
                </div>
              </details>
              <button disabled={busy} className={primary} type="submit">
                {busy ? "Saving…" : "Save and continue"}
              </button>
            </form>
          )}
          {step === 2 && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                void run(async () => {
                  if (
                    addService &&
                    (!serviceName.trim() ||
                      !servicePrice.trim() ||
                      !Number.isFinite(Number(servicePrice)))
                  )
                    throw new Error("Enter a service name and price.")
                  await save({
                    action: "prepare",
                    ...(addService
                      ? {
                          service: {
                            name: serviceName.trim(),
                            price: Number(servicePrice),
                          },
                        }
                      : {}),
                    ...(clientName.trim()
                      ? { client: { name: clientName.trim() } }
                      : {}),
                  })
                })
              }}
            >
              <p className="text-ink-500">
                Review your services and optionally add a client. No job is
                created during setup.
              </p>
              {(state.services?.length ?? 0) > 0 && (
                <ul className="divide-y divide-ink-100">
                  {state.services!.map((service) => (
                    <li key={service.id} className="py-2 flex justify-between">
                      <span>{service.name}</span>
                      <span>${service.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!state.prepared && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={addService}
                      onChange={(e) => setAddService(e.target.checked)}
                    />
                    Add a service
                  </label>
                  {addService && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field htmlFor="setup-service" label="Service name">
                        <TextInput
                          id="setup-service"
                          value={serviceName}
                          onChange={setServiceName}
                        />
                      </Field>
                      <Field htmlFor="setup-price" label="Price (USD)">
                        <TextInput
                          id="setup-price"
                          type="number"
                          min={0}
                          step="0.01"
                          value={servicePrice}
                          onChange={setServicePrice}
                        />
                      </Field>
                    </div>
                  )}
                  <Field htmlFor="setup-client" label="First client (optional)">
                    <TextInput
                      id="setup-client"
                      value={clientName}
                      onChange={setClientName}
                    />
                  </Field>
                </>
              )}
              <div className="flex gap-3 flex-wrap">
                <button disabled={busy} className={primary} type="submit">
                  {state.prepared ? "Continue" : "Save and continue"}
                </button>
                {!state.prepared && (
                  <button
                    disabled={busy}
                    className={secondary}
                    type="button"
                    onClick={() =>
                      void run(async () => {
                        await save({ action: "prepare" })
                      })
                    }
                  >
                    Do this later
                  </button>
                )}
              </div>
            </form>
          )}
          {step === 3 && (
            <>
              <p className="text-ink-600">
                Your business details are saved.{" "}
                {paid
                  ? "Your plan includes unlimited active jobs."
                  : "Free includes up to 5 scheduled or in-progress jobs. You can upgrade anytime."}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={busy}
                  className={primary}
                  onClick={() => void run(() => finish("calendar"))}
                >
                  Create your first job
                </button>
                <button
                  disabled={busy}
                  className={secondary}
                  onClick={() => void run(() => finish("dashboard"))}
                >
                  Go to dashboard
                </button>
              </div>
              <button
                disabled={busy}
                className="text-sm underline text-ink-500"
                onClick={() => void run(() => finish("tour"))}
              >
                Take an optional product tour
              </button>
            </>
          )}
          {step > 0 && (
            <button
              disabled={busy}
              className="block text-sm text-ink-500 underline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
        </section>
      </div>
    </main>
  )
}
