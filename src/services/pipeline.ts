/**
 * The lifecycle a dossier moves through, and where a given one sits right now.
 *
 * `audit_status` records a *position* but reads like a *label*: a table cell
 * saying "Te controleren" does not tell you whose turn it is, what has already
 * happened, or what has to happen next. This module turns the status into that
 * answer, so a view can render the journey rather than the enum.
 *
 * Inquiries and recoveries share `report.audit_status` (see `recoveryEnums.ts`,
 * which re-exports it), so they share this model too.
 *
 * ## What we can and cannot say today
 *
 * There is no event log. Every transition (`/status_review`, `/status_rejected`,
 * `/status_approved`, `/reset`) overwrites `audit_status` in place and keeps no
 * trace, so the *sequence* a dossier took is not recoverable — only where it
 * stands. Worse, `update_date` is not a record of human activity either: on
 * 2026-06-27 the #973 attribution backfill stamped it on 20,954 of 26,633
 * inquiries (79%), and a 2026-03-07 migration did the same to 442,698 samples.
 * Anything labelled "laatst gewijzigd" off that column would be fiction for
 * four rows in five, which is why nothing here reads it.
 *
 * So this model is deliberately narrow: current position, whose turn it is, and
 * the milestones that *are* trustworthy (`create_date`, `document_date`,
 * attribution). `DossierEvent` below is the shape a real trail will carry once
 * transitions are recorded — declared now so the UI is built against it.
 */

import { AUDIT_STATUS } from '@/services/inquiryEnums'

/** Which attribution role carries a stage. */
export type StageRole = 'creator' | 'reviewer'

export interface Stage {
  key: 'entry' | 'review' | 'published'
  label: string
  /** One line on what happens here — shown as the stage's tooltip. */
  summary: string
  /** Whose stage this is, or `null` when no one owns it (the finish line). */
  role: StageRole | null
}

export const STAGES: readonly Stage[] = [
  {
    key: 'entry',
    label: 'Invoer',
    summary: 'Adressen en waarnemingen uit het rapport overnemen',
    role: 'creator',
  },
  {
    key: 'review',
    label: 'Controle',
    summary: 'De beoordelaar controleert de invoer tegen het brondocument',
    role: 'reviewer',
  },
  {
    key: 'published',
    label: 'Afgerond',
    summary: 'Vastgesteld — de gegevens werken door in kaart en producten',
    role: null,
  },
]

export type StageState =
  /** Passed. */
  | 'done'
  /** Where the dossier sits and work is happening. */
  | 'current'
  /** Where it sits, but it is here because a later stage sent it back. */
  | 'blocked'
  /** Not reached yet. */
  | 'todo'

export interface Position {
  /** Index into `STAGES`, or `null` when the dossier left the rail entirely. */
  index: number | null
  /** Review sent it back: it is in Invoer for at least the second time. */
  returned: boolean
  /** Deliberately closed out (afgevallen) — off the rail, not finished. */
  closed: boolean
}

/**
 * Map a status onto the rail.
 *
 * `todo` and `pending` are both Invoer: the distinction between them is whether
 * anyone has touched it yet, which the milestones already convey. `rejected` is
 * Invoer too — a dossier that came back — and is what `returned` marks.
 */
export function position(status: number | null | undefined): Position {
  switch (status) {
    case AUDIT_STATUS.TODO:
    case AUDIT_STATUS.PENDING:
      return { index: 0, returned: false, closed: false }
    case AUDIT_STATUS.REJECTED:
      return { index: 0, returned: true, closed: false }
    case AUDIT_STATUS.PENDING_REVIEW:
      return { index: 1, returned: false, closed: false }
    case AUDIT_STATUS.DONE:
      return { index: 2, returned: false, closed: false }
    case AUDIT_STATUS.DISCARDED:
      return { index: null, returned: false, closed: true }
    default:
      return { index: null, returned: false, closed: false }
  }
}

export function stageState(stageIndex: number, pos: Position): StageState {
  if (pos.index === null) return 'todo'
  if (stageIndex < pos.index) return 'done'
  if (stageIndex > pos.index) return 'todo'
  // The last stage is the finish line: standing on it means it is done.
  if (stageIndex === STAGES.length - 1) return 'done'
  return pos.returned ? 'blocked' : 'current'
}

/**
 * How loudly to say it. `attention` is "someone is being waited on",
 * `critical` is "something went wrong and needs undoing" — the two look alike
 * in a state machine and read very differently across a desk.
 */
export type NextStepTone = 'neutral' | 'attention' | 'critical' | 'positive'

export interface NextStep {
  /** Who has to move. `null` when nobody does. */
  role: StageRole | 'admin' | null
  title: string
  detail: string
  tone: NextStepTone
}

/**
 * What has to happen next, phrased as an instruction rather than a state.
 *
 * The wording names the responsible role and not the current user, because the
 * same panel is read by the person who is up and by the person waiting on them.
 */
export function nextStep(status: number | null | undefined): NextStep {
  switch (status) {
    case AUDIT_STATUS.TODO:
      return {
        role: 'creator',
        title: 'Invoer starten',
        detail: 'Er zijn nog geen gegevens ingevoerd voor dit dossier.',
        tone: 'neutral',
      }
    case AUDIT_STATUS.PENDING:
      return {
        role: 'creator',
        title: 'Invoer afmaken en aanbieden',
        detail: 'Zodra de adressen compleet zijn kan het dossier ter controle worden aangeboden.',
        tone: 'neutral',
      }
    case AUDIT_STATUS.PENDING_REVIEW:
      return {
        role: 'reviewer',
        title: 'Wacht op controle',
        detail: 'De beoordelaar moet de invoer goedkeuren of met een reden afkeuren.',
        tone: 'attention',
      }
    case AUDIT_STATUS.REJECTED:
      return {
        role: 'creator',
        title: 'Afgekeurd — aanpassen en opnieuw aanbieden',
        detail:
          'De beoordelaar heeft het dossier teruggestuurd. De reden staat in de mail aan de opsteller; de app bewaart die nog niet.',
        tone: 'critical',
      }
    case AUDIT_STATUS.DONE:
      return {
        role: null,
        title: 'Afgerond',
        detail: 'De gegevens zijn vastgesteld. Alleen een beheerder kan het dossier heropenen.',
        tone: 'positive',
      }
    case AUDIT_STATUS.DISCARDED:
      return {
        role: null,
        title: 'Afgevallen',
        detail: 'Dit dossier is bewust afgesloten zonder te worden vastgesteld.',
        tone: 'neutral',
      }
    default:
      return {
        role: null,
        title: 'Onbekende status',
        detail: 'De status van dit dossier is niet te bepalen.',
        tone: 'neutral',
      }
  }
}

export const ROLE_LABELS: Record<StageRole | 'admin', string> = {
  creator: 'Opsteller',
  reviewer: 'Beoordelaar',
  admin: 'Beheerder',
}

/**
 * One thing that happened to a dossier.
 *
 * Not produced yet — no transition is recorded anywhere. Declared here so that
 * the trail UI, the shape the API will return, and the columns a future
 * `report.dossier_event` table needs are agreed on in one place. `imported` and
 * `proposed` are the Data Ops pipeline's entries (see
 * `FunderMapsWorker/docs/dataops-pipeline.md`): a dossier that arrived as a
 * document rather than being typed, and a field the pipeline filled in.
 */
export type DossierEventKind =
  'created' | 'submitted' | 'approved' | 'rejected' | 'reopened' | 'imported' | 'proposed'

export interface DossierEvent {
  kind: DossierEventKind
  at: string
  byName?: string | null
  /** Free text the event carried — a rejection motivation, an import source. */
  note?: string | null
}
