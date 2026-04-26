import { get } from '../client'
import type { IContractor } from '../interfaces/IContractor'

export async function list() {
  return (await get({ endpoint: '/data/contractor' })) as IContractor[]
}

export default { list }
