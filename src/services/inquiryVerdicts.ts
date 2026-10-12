/**
 * The rules of a commit with several inquiries (Don, 2026-10-09): which
 * addresses an inquiry is about, and what still stands in the way of the
 * commit. Kept out of the review view so they can be read and checked without
 * a browser.
 */
import { BLANK, hasBlank } from '@/services/closeTemplates'
import type { IDossierAddress } from '@/services/fundermaps/interfaces/IDataops'

/** What the API accepts (FunderMapsApi dataops-commit.ts): text, inquiries per commit, addresses per inquiry. */
export const ANSWER_MAX = 4000
export const INQUIRIES_MAX = 20
export const ADDRESSES_MAX = 200

/** The addresses an inquiry can be about: resolved and not put aside. */
export const offeredAddresses = (addresses: IDossierAddress[]) =>
  addresses.filter((a) => a.addressId && a.state !== 'rejected').map((a) => ({ value: a.addressId!, label: a.label ?? a.addressId! }))

/**
 * The addresses an inquiry is about until the reviewer says otherwise: the
 * dossier's own and the ones a person confirmed or added. An address the
 * pipeline read from a document and nobody confirmed stays off: ticked, the
 * values the document gives without an address would land on it too, and an
 * untouched commit wrote wood on three front doors where the report was about
 * one.
 */
export const defaultInquiryAddresses = (addresses: IDossierAddress[]): string[] =>
  addresses.filter((a) => a.addressId && a.state !== 'rejected' && (a.own || a.state === 'confirmed')).map((a) => a.addressId!)

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/**
 * What the checklist shows and what the commit sends for one inquiry.
 *
 * `send` is null while the reviewer has not widened or narrowed the inquiry
 * beyond the dossier's own address: the API then writes exactly what it wrote
 * before there was a checklist (the values on the melder's address, a sample
 * only where there is something to put in it). Anything else is sent as
 * chosen, an empty list included: that one is the caller's to refuse.
 */
export function inquiryAddresses(input: { offered: string[]; defaults: string[]; chosen: string[] | undefined; ownId: string | null }): {
  shown: string[]
  send: string[] | null
} {
  const defaults = input.defaults.filter((id) => input.offered.includes(id))
  const shown = (input.chosen ?? defaults).filter((id) => input.offered.includes(id))
  const onlyOwn = defaults.length === 0 || (defaults.length === 1 && defaults[0] === input.ownId)
  return { shown, send: onlyOwn && sameSet(shown, defaults) ? null : shown }
}

export interface InquiryForCommit {
  n: number
  verdict: 'accepted' | 'rejected'
  answer: string
  dateMissing: boolean
  unmergeable: string[]
  /** What the commit sends; null leaves the addresses to the API. */
  addressIds: string[] | null
}

/**
 * Why the commit cannot go yet, in the words for the button's tooltip; null
 * when it can. `closeNote` is the Reden as the commit will send it;
 * `noteHeld` says the Reden on screen is the prefilled one that a commit
 * leaves behind, so "fill in the reason" would point at a field that looks
 * filled.
 */
export function commitBlocker(groups: InquiryForCommit[], closeNote: string, noteHeld = false): string | null {
  if (!groups.length) return 'Zet minstens één bestand in een inquiry'
  if (groups.length > INQUIRIES_MAX) return `Meer dan ${INQUIRIES_MAX} inquiries in één melding kan niet: voeg bestanden samen`
  const accepted = groups.filter((g) => g.verdict === 'accepted')
  if (accepted.some((g) => g.unmergeable.length)) return 'Een bestand kan niet in één PDF: zet het in een eigen inquiry'
  if (groups.some((g) => hasBlank(g.answer)) || hasBlank(closeNote)) return `Vul eerst de open plekken (${BLANK}) in de tekst in`
  if (groups.some((g) => g.answer.length > ANSWER_MAX) || closeNote.length > ANSWER_MAX) return `Een antwoord of de reden is langer dan ${ANSWER_MAX} tekens`
  // A refusal the melder reads needs a reason: per inquiry, or one for the dossier.
  if (!closeNote.trim() && groups.some((g) => g.verdict === 'rejected' && !g.answer.trim())) {
    return `Geef bij elke afgewezen inquiry een antwoord, of ${noteHeld ? 'pas de automatisch gekozen reden aan' : 'vul de reden in'}`
  }
  if (accepted.some((g) => g.addressIds?.length === 0)) return 'Kies bij elke inquiry minstens één adres'
  if (accepted.some((g) => (g.addressIds?.length ?? 0) > ADDRESSES_MAX)) return `Meer dan ${ADDRESSES_MAX} adressen in één inquiry kan niet`
  if (accepted.some((g) => g.dateMissing)) return 'Vul eerst bij elke inquiry de datum in'
  return null
}

/** The error under one inquiry's answer, or null. */
export function answerError(g: Pick<InquiryForCommit, 'verdict' | 'answer'>, closeNote: string, noteHeld = false): string | null {
  if (hasBlank(g.answer)) return `Vul eerst de ${BLANK} in`
  if (g.answer.length > ANSWER_MAX) return `Maximaal ${ANSWER_MAX} tekens; dit zijn er ${g.answer.length}`
  if (g.verdict === 'rejected' && !g.answer.trim() && !closeNote.trim()) {
    return `Geef een antwoord voor de melder, of ${noteHeld ? 'pas onderaan de automatisch gekozen reden aan' : 'vul onderaan de reden in'}`
  }
  return null
}

/** "Bij overnemen …" above the buttons: what the commit makes of the inquiries as they stand. */
export function commitSummary(groups: Pick<InquiryForCommit, 'verdict'>[]): string {
  const accepted = groups.filter((g) => g.verdict === 'accepted').length
  const rejected = groups.length - accepted
  const made = accepted === 1 ? 'komt er 1 inquiry' : `komen er ${accepted} inquiries`
  if (!accepted) return `${groups.length === 1 ? 'De inquiry wordt' : 'Alle inquiries worden'} afgewezen: er komt geen rapportage, het dossier wordt afgewezen`
  return rejected ? `Bij overnemen ${made}; ${rejected} ${rejected === 1 ? 'wordt' : 'worden'} afgewezen` : `Bij overnemen ${made}`
}
