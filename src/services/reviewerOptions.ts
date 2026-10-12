/**
 * Who may be chosen as beoordelaar on a report.
 *
 * Everyone on the organisation's reviewer list but the one who made the
 * report: the database refuses a report whose creator is also its reviewer
 * (`creator_reviewer_chk` on `application.attribution`), and a choice that can
 * only fail is not offered.
 *
 * Found 2026-10-12: a colleague reworking three rejected reports picked the
 * usual reviewer, who had created all three. The list offered the name, the
 * save came back as a bare 500, and Opslaan was pressed 21 times.
 *
 * The creator is the stored one on an edit, and the person at the keyboard on
 * a create.
 */
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import type { SelectOption } from '@/services/options'

const personName = (u: IUser) => [u.given_name, u.family_name].filter(Boolean).join(' ').trim() || u.email

export function reviewerOptionsFor(reviewers: IUser[], creatorId: string | null | undefined): SelectOption[] {
  return reviewers.filter((r) => r.id !== creatorId).map((r) => ({ value: r.id, label: personName(r) }))
}

/**
 * The line under the field. When the creator would otherwise be on the list
 * it says why the name is missing, so nobody goes looking for it.
 */
export function reviewerHintFor(reviewers: IUser[], creatorId: string | null | undefined): string {
  const creator = reviewers.find((r) => r.id === creatorId)
  return creator
    ? `krijgt het dossier na aanbieden · niet ${personName(creator)}, de aanmaker`
    : 'krijgt het dossier na aanbieden'
}
