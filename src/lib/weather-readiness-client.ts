import { getAuthFetchHeaders } from '@/lib/pb-auth'
import { isoDate, type WeatherReadinessResult } from '@/lib/weather-risk'

const UNRESOLVED: WeatherReadinessResult = {
  status: 'unresolved',
  rows: [],
}

export async function fetchWeatherReadiness(): Promise<WeatherReadinessResult> {
  const today = isoDate(new Date())

  try {
    const res = await fetch('/api/weather/readiness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthFetchHeaders(),
      },
      body: JSON.stringify({ today }),
    })

    if (!res.ok) {
      console.warn('[weather-readiness] API', res.status)
      return UNRESOLVED
    }

    const data = (await res.json()) as { readiness?: WeatherReadinessResult }
    return data.readiness ?? UNRESOLVED
  } catch (err) {
    console.warn('[weather-readiness] fetch failed', err)
    return UNRESOLVED
  }
}
