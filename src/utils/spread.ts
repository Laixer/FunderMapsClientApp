import type { IProposedField } from '@/services/fundermaps/interfaces/IDataops'

/**
 * Values the Worker spread over a range of addresses (Worker #186): a report
 * that covers "Olympiaweg 52 t/m 92" yields the same reading, field, value and
 * citation on every address in the range. The review screen shows such a set
 * as one card and decides it with one verdict call (API #199 `fieldIds`) --
 * Don, 2026-09-20: "geldt voor 40 panden en één klik". Each address still gets
 * its own verdict row; what the set shares is the click.
 */
export const spreadKey = (f: IProposedField): string =>
  [f.artifactId, f.field, f.value ?? '', f.evidence ?? '', f.evidencePage ?? ''].join('|')

/**
 * Representative field id -> every field of its set, for the sets that sit on
 * two or more distinct addresses. `extra` narrows the key further (the settled
 * list adds the outcome, so a set decided two ways shows as two cards).
 */
export function spreadSets(
  fields: IProposedField[],
  extra: (f: IProposedField) => string = () => '',
): Map<number, IProposedField[]> {
  const byKey = new Map<string, IProposedField[]>()
  for (const f of fields) {
    if (!f.addressId) continue
    const k = `${spreadKey(f)}|${extra(f)}`
    byKey.set(k, [...(byKey.get(k) ?? []), f])
  }
  const out = new Map<number, IProposedField[]>()
  for (const members of byKey.values()) {
    if (new Set(members.map((m) => m.addressId)).size < 2) continue
    out.set(members[0]!.id, members)
  }
  return out
}

/** The ids that a card stands in for (every member except the representative). */
export function hiddenMembers(sets: Map<number, IProposedField[]>): Set<number> {
  const hidden = new Set<number>()
  for (const [rep, members] of sets) for (const m of members) if (m.id !== rep) hidden.add(m.id)
  return hidden
}

/** One key for "these values cover the same addresses", so a range's fields share one section. */
export const addressSetKey = (members: IProposedField[]): string =>
  `range:${[...new Set(members.map((m) => m.addressId))].sort().join(',')}`
