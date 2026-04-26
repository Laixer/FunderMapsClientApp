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

export default { list, getCount, getById, create, update, remove }
