export const webMirrorStore = new Map<string, string>()

export const webQueueStore: {
  id: string
  operation: string
  created_at: string
  retries: number
}[] = []

export const webDraftStore = new Map<
  string,
  {
    entity: string
    entity_id: string
    payload: string
    updated_at: string
  }
>()
