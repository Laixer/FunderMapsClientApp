import { get } from '../client'
import type { IOrganization, IOrganizationMember } from '../interfaces/IOrganization'

export async function getCurrent() {
  return (await get({ endpoint: '/organization' })) as IOrganization
}

export async function getById(id: string) {
  return (await get({ endpoint: `/organization/${id}` })) as IOrganization
}

/** Admin-only list of all organisations. */
export async function listAll() {
  return (await get({ endpoint: '/organization/all' })) as IOrganization[]
}

export async function listMembers() {
  return (await get({ endpoint: '/organization/user' })) as IOrganizationMember[]
}

export default { getCurrent, getById, listAll, listMembers }
