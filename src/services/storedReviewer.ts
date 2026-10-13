/**
 * The beoordelaar a record already has, when the list no longer offers them.
 *
 * `GET /reviewer` returns the reviewers of your own organisation as it is
 * today. A record keeps the reviewer it was given: someone who has left since,
 * or a reviewer of another organisation on a record that organisation made.
 * A select whose value matches none of its options shows nothing, so on those
 * records "Beoordelaar" looked empty although one was set: most herstel
 * records, when found on 2026-10-13.
 *
 * So the stored reviewer rides along as one extra option, marked as not on
 * the list. The form keeps the stored id until someone picks another.
 */
import type { SelectOption } from '@/services/options'

export interface StoredReviewer {
  id: string
  /** What the record calls them: `attribution.reviewerName`, which is their e-mail address. */
  name: string | null
}

export function withStoredReviewer(
  options: SelectOption[],
  stored: StoredReviewer | null,
  creatorId: string | null | undefined,
): SelectOption[] {
  if (!stored?.id || options.some((option) => option.value === stored.id)) return options
  // The maker is left off the list on purpose (see reviewerOptions.ts) and is
  // not brought back through this door.
  if (stored.id === creatorId) return options
  const name = stored.name?.trim() || 'Huidige beoordelaar'
  return [...options, { value: stored.id, label: `${name} · niet (meer) op de lijst` }]
}
