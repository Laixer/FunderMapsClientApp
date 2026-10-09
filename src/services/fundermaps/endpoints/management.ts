import { get, put } from '../client'

/**
 * The admin side of the API (`/api/management/*`, global `administrator` role
 * only; everyone else gets a 403). The Studio uses just the work-package
 * assignment from it; the rest of management lives in the admin app.
 */

export interface IWorkPackageAssignment {
  userId: string
  packageIds: string[]
}

/** Every colleague the admin composed a set for. Absent = they choose their own. */
export async function workPackages() {
  return (await get({ endpoint: '/management/work-packages' })) as {
    assignments: IWorkPackageAssignment[]
  }
}

/** Replace one colleague's set as a whole; `[]` hands the choice back to them. */
export async function setWorkPackages(userId: string, packageIds: string[]) {
  return (await put({
    endpoint: `/management/work-packages/${encodeURIComponent(userId)}`,
    body: { packageIds } as unknown as Record<string, unknown>,
  })) as IWorkPackageAssignment
}

export default { workPackages, setWorkPackages }
