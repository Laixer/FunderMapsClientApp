/**
 * The API only returns `id` and `name` from the organization table.
 * (Verified 2026-04-26 against ~/Projects/FunderMapsApi/src/routes/organization.ts.)
 * If the schema gains email/phone/branding columns later, expand this type.
 */
export interface IOrganization {
  id: string
  name: string
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
