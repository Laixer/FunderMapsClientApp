import { get, post, put, del } from '../client'
import type { IInquirySample, IInquirySampleInput } from '../interfaces/IInquirySample'

interface IStats {
  count: number
}

export async function list(
  inquiryId: number,
  opts: { limit?: number; offset?: number } = {},
) {
  const queryString: Record<string, string> = {}
  if (opts.limit != null) queryString.limit = String(opts.limit)
  if (opts.offset != null) queryString.offset = String(opts.offset)
  return (await get({
    endpoint: `/inquiry/${inquiryId}/sample`,
    queryString,
  })) as IInquirySample[]
}

/**
 * Fetch *every* sample for an inquiry by walking the offset. A single call is
 * capped (the API defaults to a page of 100 and honours an arbitrary `limit`
 * with no documented maximum); an inquiry can hold far more addresses than one
 * page, so a capped call silently hides the rest. Pages until a short page
 * signals the end.
 */
export async function listAll(
  inquiryId: number,
  pageSize = 500,
): Promise<IInquirySample[]> {
  const all: IInquirySample[] = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await list(inquiryId, { limit: pageSize, offset })
    all.push(...page)
    if (page.length < pageSize) break
  }
  return all
}

export async function getCount(inquiryId: number) {
  return (await get({ endpoint: `/inquiry/${inquiryId}/sample/stats` })) as IStats
}

export async function getById(inquiryId: number, sampleId: number) {
  return (await get({
    endpoint: `/inquiry/${inquiryId}/sample/${sampleId}`,
  })) as IInquirySample
}

export async function create(inquiryId: number, data: IInquirySampleInput) {
  return (await post({
    endpoint: `/inquiry/${inquiryId}/sample`,
    body: data as unknown as Record<string, unknown>,
  })) as IInquirySample
}

export async function update(
  inquiryId: number,
  sampleId: number,
  data: IInquirySampleInput,
) {
  await put({
    endpoint: `/inquiry/${inquiryId}/sample/${sampleId}`,
    body: data as unknown as Record<string, unknown>,
  })
}

export async function remove(inquiryId: number, sampleId: number) {
  await del({ endpoint: `/inquiry/${inquiryId}/sample/${sampleId}` })
}

export default { list, listAll, getCount, getById, create, update, remove }
