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

export default { list, getCount, getById, create, update, remove }
