import { useEffect, useState } from "react"
import { useData } from "@/providers/DataProvider"
import { useDeskNav } from "@/providers/DeskNavProvider"
import { useOptionalTour } from "@/components/tour/tour-provider"
import { loadJobAllowance } from "@/lib/job-allowance"
export function JobAllowanceBanner() {
  const { jobs } = useData()
  const { setPage, openSettings } = useDeskNav()
  const tour = useOptionalTour()
  const [value, setValue] =
    useState<Awaited<ReturnType<typeof loadJobAllowance>> | null>(null)
  const [error, setError] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (tour?.active) return
    let alive = true
    setValue(null)
    setError(false)
    void loadJobAllowance()
      .then((next) => {
        if (alive) setValue(next)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    const refresh = () => setVersion((n) => n + 1)
    window.addEventListener("focus", refresh)
    window.addEventListener("rinse-plan-updated", refresh)
    return () => {
      alive = false
      window.removeEventListener("focus", refresh)
      window.removeEventListener("rinse-plan-updated", refresh)
    }
  }, [jobs, version, tour?.active])
  if (tour?.active || value?.paid) return null
  return (
    <aside
      aria-label="Plan usage"
      className="mx-6 mt-4 rounded-xl border border-ink-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <p className="text-sm font-semibold">
          {error
            ? "Plan usage unavailable"
            : value
              ? `Free · ${value.count} of ${value.limit} active jobs`
              : "Checking plan usage…"}
        </p>
        {value && (
          <p className="text-xs text-ink-500 mt-1">
            Scheduled and in-progress jobs count. Complete or cancel a job to
            free a slot.
          </p>
        )}
      </div>
      {error ? (
        <button
          className="text-sm underline"
          onClick={() => setVersion((n) => n + 1)}
        >
          Retry
        </button>
      ) : (
        value && (
          <div className="flex gap-4 text-sm">
            <button
              className="text-brand-700 font-semibold"
              onClick={() => openSettings("account")}
            >
              Upgrade in Settings
            </button>
            {value.count >= value.limit && (
              <button className="underline" onClick={() => setPage("calendar")}>
                Manage jobs
              </button>
            )}
          </div>
        )
      )}
    </aside>
  )
}
