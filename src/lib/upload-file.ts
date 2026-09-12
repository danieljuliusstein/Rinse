import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { appendPhotoToFormData } from './form-data-file'
import { getPocketBase, getPbUrl } from './pocketbase'
import { formatPocketBaseError } from './pocketbase-errors'

/**
 * Upload a local image file onto a PocketBase record field (e.g. `photos+`, `photo`).
 * Native uses FileSystem.uploadAsync — RN fetch+FormData often fails with a generic
 * "Something went wrong." from the PocketBase SDK.
 */
export async function uploadPocketBaseFile(input: {
  collection: string
  recordId: string
  /** PocketBase file field, use `photos+` to append. */
  field: string
  fileUri: string
  filename: string
  mimeType: string
  /** Extra multipart text fields (create flows). */
  parameters?: Record<string, string>
  method?: 'POST' | 'PATCH'
}): Promise<Record<string, unknown>> {
  const {
    collection,
    recordId,
    field,
    fileUri,
    filename,
    mimeType,
    parameters,
    method = 'PATCH',
  } = input

  if (Platform.OS === 'web') {
    const client = getPocketBase()
    if (!client.authStore.isValid) throw new Error('PocketBase not authenticated')
    const formData = new FormData()
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        formData.append(key, value)
      }
    }
    await appendPhotoToFormData(formData, field, fileUri, filename, mimeType)
    if (method === 'POST') {
      return (await client.collection(collection).create(formData)) as Record<string, unknown>
    }
    return (await client.collection(collection).update(recordId, formData)) as Record<string, unknown>
  }

  const client = getPocketBase()
  const token = client.authStore.token
  if (!client.authStore.isValid || !token) {
    throw new Error('PocketBase not authenticated')
  }

  const base = getPbUrl().replace(/\/$/, '')
  const url =
    method === 'POST'
      ? `${base}/api/collections/${collection}/records`
      : `${base}/api/collections/${collection}/records/${recordId}`

  let uri = fileUri
  if (uri.startsWith('/') && !uri.startsWith('file://')) {
    uri = `file://${uri}`
  }

  const result = await FileSystem.uploadAsync(url, uri, {
    httpMethod: method,
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: field,
    mimeType: mimeType || 'image/jpeg',
    parameters,
    headers: {
      Authorization: token,
    },
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
  })

  let body: Record<string, unknown> = {}
  try {
    body = result.body ? (JSON.parse(result.body) as Record<string, unknown>) : {}
  } catch {
    body = { message: result.body || 'Upload failed' }
  }

  if (result.status < 200 || result.status >= 300) {
    const err = {
      url,
      status: result.status,
      response: body,
      data: body,
    }
    throw new Error(formatPocketBaseError(err, `Upload failed (${result.status})`))
  }

  return body
}

/** Multipart PATCH for text fields (file deletes, JSON fields) — reliable on native RN. */
export async function patchPocketBaseForm(
  collection: string,
  recordId: string,
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  const client = getPocketBase()
  const token = client.authStore.token
  if (!client.authStore.isValid || !token) {
    throw new Error('PocketBase not authenticated')
  }

  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value)
  }

  if (Platform.OS === 'web') {
    return (await client.collection(collection).update(recordId, formData)) as Record<string, unknown>
  }

  const base = getPbUrl().replace(/\/$/, '')
  const url = `${base}/api/collections/${collection}/records/${recordId}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: token },
    body: formData,
  })

  let body: Record<string, unknown> = {}
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  if (!response.ok) {
    throw new Error(
      formatPocketBaseError(
        { status: response.status, response: body, data: body },
        `Update failed (${response.status})`,
      ),
    )
  }

  return body
}
