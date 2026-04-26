/**
 * Shape of /api/user/me. Matches the TS API canonical snake_case wire format.
 */
export interface IUser {
  id: string
  email: string
  given_name: string | null
  family_name: string | null
  picture: string | null
  job_title: string | null
  phone_number: string | null
  role: string | null
  organizations: Array<{
    id: string
    name: string
    role: 'superuser' | 'verifier' | 'writer' | 'reader'
  }>
}

export type OrgRole = IUser['organizations'][number]['role']
