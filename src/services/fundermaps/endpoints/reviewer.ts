import { get } from '../client'
import type { IUser } from '../interfaces/IUser'

/** Org members eligible to review (superuser or verifier roles). */
export async function list() {
  return (await get({ endpoint: '/reviewer' })) as IUser[]
}

export default { list }
