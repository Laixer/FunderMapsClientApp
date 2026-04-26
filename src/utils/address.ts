import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'

/**
 * Render a geocoded address as a single Dutch-style line:
 *   "Hoofdstraat 1, 1000 AA Amsterdam"
 * Falls back to dashes for missing parts.
 */
export function formatAddress(addr: IAddress | null | undefined): string {
  if (!addr) return '-'
  const street = [addr.street, addr.building_number].filter(Boolean).join(' ').trim()
  const city = [addr.postal_code, addr.city].filter(Boolean).join(' ').trim()
  return [street, city].filter(Boolean).join(', ') || addr.id
}
