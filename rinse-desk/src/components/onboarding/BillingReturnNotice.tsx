import { useEffect, useState } from "react"
import { fetchOrgSubscription, isSubscriptionActive } from "@/lib/subscription"
export function BillingReturnNotice() {
  const [result, setResult] = useState(() =>
    new URLSearchParams(window.location.search).get("desktop_billing"),
  )
  const [message, setMessage] = useState("Checking payment confirmation…")
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (result !== "success") return
    let alive = true
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>
    const check = async () => {
      try {
        const org = await fetchOrgSubscription(true, true)
        if (!alive) return
        if (org && isSubscriptionActive(org)) {
          setMessage(
            "Your paid plan is active. You have unlimited active jobs.",
          )
          window.dispatchEvent(new Event("rinse-plan-updated"))
          return
        }
        setMessage(
          "Payment confirmation is pending. Your current plan stays in effect until it is confirmed.",
        )
      } catch {
        if (alive)
          setMessage("Could not check payment confirmation. Please retry.")
      }
      attempts += 1
      if (alive && attempts < 10) timer = setTimeout(() => void check(), 3000)
    }
    void check()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [result, retry])
  if (!["success", "cancel"].includes(result || "")) return null
  return (
    <aside
      className="mx-6 mt-4 rounded-xl border border-ink-200 bg-white p-4 flex flex-wrap gap-4 items-center"
      aria-label="Payment status"
    >
      <p role="status" className="text-sm flex-1">
        {result === "cancel"
          ? "Checkout was canceled. Your plan has not changed."
          : message}
      </p>
      {result === "success" && (
        <button
          className="text-sm underline"
          onClick={() => setRetry((n) => n + 1)}
        >
          Refresh plan
        </button>
      )}
      <button
        className="text-sm underline"
        onClick={() => {
          const url = new URL(window.location.href)
          url.searchParams.delete("desktop_billing")
          window.history.replaceState(null, "", url)
          setResult(null)
        }}
      >
        Dismiss
      </button>
    </aside>
  )
}
