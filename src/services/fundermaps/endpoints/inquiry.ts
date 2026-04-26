import { get, post, put, del } from '../client'
import type { IInquiry, IInquiryInput } from '../interfaces/IInquiry'

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
  return (await get({ endpoint: '/inquiry', queryString })) as IInquiry[]
}

export async function getCount() {
  return (await get({ endpoint: '/inquiry/stats' })) as IStats
}

export async function getById(id: number) {
  return (await get({ endpoint: `/inquiry/${id}` })) as IInquiry
}

export async function create(data: IInquiryInput) {
  return (await post({
    endpoint: '/inquiry',
    body: data as unknown as Record<string, unknown>,
  })) as IInquiry
}

export async function update(id: number, data: IInquiryInput) {
  await put({
    endpoint: `/inquiry/${id}`,
    body: data as unknown as Record<string, unknown>,
  })
}

export async function remove(id: number) {
  await del({ endpoint: `/inquiry/${id}` })
}

export async function submitForReview(id: number) {
  await post({ endpoint: `/inquiry/${id}/status_review` })
}

export async function approve(id: number) {
  await post({ endpoint: `/inquiry/${id}/status_approved` })
}

export async function reject(id: number, message: string) {
  await post({ endpoint: `/inquiry/${id}/status_rejected`, body: { message } })
}

export async function reset(id: number) {
  await post({ endpoint: `/inquiry/${id}/reset` })
}

export async function getDownload(id: number) {
  return (await get({ endpoint: `/inquiry/${id}/download` })) as IDownloadInfo
}

/**
 * Upload the report's PDF document. Multipart upload returns the unique
 * stored filename, which then goes into IInquiry.documentFile on create/update.
 * The API expects the multipart field to be named `input` (matches the
 * legacy C# `[FormFile] IFormFile input` signature).
 */
export async function uploadDocument(file: File): Promise<{ name: string }> {
  const form = new FormData()
  form.append('input', file)
  return (await post({ endpoint: '/inquiry/upload-document', body: form })) as {
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
