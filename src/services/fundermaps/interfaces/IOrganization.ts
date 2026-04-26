export interface IOrganization {
  id: string
  name: string
  email: string | null
  phone_number: string | null
  registration_number: string | null
  branding_logo: string | null
}

/** Member row returned by /api/organization/user. */
export interface IOrganizationMember {
  id: string
  email: string
  given_name: string | null
  family_name: string | null
  picture: string | null
  job_title: string | null
  phone_number: string | null
  organization_role: 'superuser' | 'verifier' | 'writer' | 'reader'
}
