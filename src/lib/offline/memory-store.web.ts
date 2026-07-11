export const webMirrorStore = new Map<string, string>()

export const webQueueStore: {
  id: string
  operation: string
  created_at: string
  retries: number
}[] = []
