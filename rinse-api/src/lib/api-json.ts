/** Parse JSON API responses; avoids opaque "Unexpected end of JSON input" errors. */
export async function readApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok ? 'Empty response from server' : `Request failed (${res.status})`,
    )
  }
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(
      text.trimStart().startsWith('<')
        ? `Server error (${res.status})`
        : `Invalid server response (${res.status})`,
    )
  }
}
