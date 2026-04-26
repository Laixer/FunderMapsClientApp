import { get } from '../client'
import type { IUser } from '../interfaces/IUser'

export async function me(): Promise<IUser> {
  return (await get({ endpoint: '/user/me' })) as IUser
}

export default { me }
