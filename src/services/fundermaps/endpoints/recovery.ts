import { get, post, put, del } from '../client'
import type { IRecovery, IRecoveryInput } from '../interfaces/IRecovery'

interface IStats {
  count: number
}

interface IDownloadInfo {
  /** The API returns this field as `accessLink` — the signed URL to the document. */
  accessLink: string
}

export async function list(opts: { limit?: number; offset?: number } = {}) {
  const queryString: Record<string, string> = {}
  if (opts.limit != null) queryString.limit = String(opts.limit)
  if (opts.offset != null) queryString.offset = String(opts.offset)
  return (await get({ endpoint: '/recovery', queryString })) as IRecovery[]
}

export async function getCount() {
  return (await get({ endpoint: '/recovery/stats' })) as IStats
}

export async function getById(id: number) {
  return (await get({ endpoint: `/recovery/${id}` })) as IRecovery
}

export async function create(data: IRecoveryInput) {
  return (await post({
    endpoint: '/recovery',
    body: data as unknown as Record<string, unknown>,
  })) as IRecovery
}

export async function update(id: number, data: IRecoveryInput) {
  await put({
    endpoint: `/recovery/${id}`,
    body: data as unknown as Record<string, unknown>,
  })
}

export async function remove(id: number) {
  await del({ endpoint: `/recovery/${id}` })
}

export async function submitForReview(id: number) {
  await post({ endpoint: `/recovery/${id}/status_review` })
}

export async function approve(id: number) {
  await post({ endpoint: `/recovery/${id}/status_approved` })
}

export async function reject(id: number, message: string) {
  await post({ endpoint: `/recovery/${id}/status_rejected`, body: { message } })
}

export async function reset(id: number) {
  await post({ endpoint: `/recovery/${id}/reset` })
}

export async function getDownload(id: number) {
  return (await get({ endpoint: `/recovery/${id}/download` })) as IDownloadInfo
}

/**
 * Upload the recovery's PDF document. Multipart upload returns the unique
 * stored filename, which then goes into IRecovery.documentFile on create/update.
 */
export async function uploadDocument(file: File): Promise<{ name: string }> {
  const form = new FormData()
  form.append('input', file)
  return (await post({ endpoint: '/recovery/upload-document', body: form })) as {
    name: string
  }
}

export default {
  list,
  getCount,
  getById,
  create,
  update,
  remove,
  submitForReview,
  approve,
  reject,
  reset,
  getDownload,
  uploadDocument,
}
