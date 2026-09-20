import { get, post } from '../client'
import type { IContractor } from '../interfaces/IContractor'

export async function list() {
  return (await get({ endpoint: '/data/contractor' })) as IContractor[]
}

/**
 * Add a bureau the pipeline read off a cover but the list does not have
 * (#194). Staff-only, and only for a verifier or superuser -- the API gates
 * it on `contractor: ["create"]` in the platform organisation.
 *
 * It lives under /dataops rather than beside the public GET because that
 * whole prefix is already the staff-gated review lane.
 *
 * `created` says which of the two happened: false means the name normalises
 * onto a row we already had ("Duyts Bouwconstructies B.V." onto "Duyts
 * Bouwconstructies"), and the row that comes back is that existing one. The
 * table has no delete, so the API would rather hand back a duplicate than
 * make one.
 */
export async function create(name: string) {
  return (await post({
    endpoint: '/dataops/contractor',
    body: { name } as unknown as Record<string, unknown>,
  })) as IContractor & { created: boolean }
}

export default { list, create }
