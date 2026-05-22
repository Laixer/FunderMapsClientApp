import { get, post, put, del } from '../client'
import type { IRecoverySample, IRecoverySampleInput } from '../interfaces/IRecoverySample'

interface IStats {
  count: number
}

export async function list(
  recoveryId: number,
  opts: { limit?: number; offset?: number } = {},
) {
  const queryString: Record<string, string> = {}
  if (opts.limit != null) queryString.limit = String(opts.limit)
  if (opts.offset != null) queryString.offset = String(opts.offset)
  return (await get({
    endpoint: `/recovery/${recoveryId}/sample`,
    queryString,
  })) as IRecoverySample[]
}

/**
 * Fetch *every* sample for a recovery by walking the offset. A single call is
 * capped (the API defaults to a page of 100 and honours an arbitrary `limit`
 * with no documented maximum); a recovery can hold far more addresses than one
 * page, so a capped call silently hides the rest. Pages until a short page
 * signals the end.
 */
export async function listAll(
  recoveryId: number,
  pageSize = 500,
): Promise<IRecoverySample[]> {
  const all: IRecoverySample[] = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await list(recoveryId, { limit: pageSize, offset })
    all.push(...page)
    if (page.length < pageSize) break
  }
  return all
}

export async function getCount(recoveryId: number) {
  return (await get({ endpoint: `/recovery/${recoveryId}/sample/stats` })) as IStats
}

export async function getById(recoveryId: number, sampleId: number) {
  return (await get({
    endpoint: `/recovery/${recoveryId}/sample/${sampleId}`,
  })) as IRecoverySample
}

export async function create(recoveryId: number, data: IRecoverySampleInput) {
  return (await post({
    endpoint: `/recovery/${recoveryId}/sample`,
    body: data as unknown as Record<string, unknown>,
  })) as IRecoverySample
}

export async function update(
  recoveryId: number,
  sampleId: number,
  data: IRecoverySampleInput,
) {
  await put({
    endpoint: `/recovery/${recoveryId}/sample/${sampleId}`,
    body: data as unknown as Record<string, unknown>,
  })
}

export async function remove(recoveryId: number, sampleId: number) {
  await del({ endpoint: `/recovery/${recoveryId}/sample/${sampleId}` })
}

export default { list, listAll, getCount, getById, create, update, remove }
