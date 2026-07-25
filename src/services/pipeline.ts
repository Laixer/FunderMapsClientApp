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
 * ## What we can and cannot say
 *
 * Transitions overwrite `audit_status` in place, so the status column knows
 * where a dossier stands and nothing about how it got there. `report.dossier_event`
 * carries the history instead (`DossierEvent` below), but only from the day it
 * was added: the 26k dossiers that predate it hold one truthful backfilled
 * `created` entry each and nothing more.
 *
 * `update_date` does not fill that gap and is never read here. The #973
 * attribution backfill stamped 2026-06-27 onto 20,954 of 26,633 inquiries (79%)
 * and a 2026-03-07 migration did the same to 442,698 samples, so a
 * "laatst gewijzigd" built on it would be fiction for four rows in five.
 *
 * What remains trustworthy without the trail: current position, whose turn it
 * is, `create_date`, `document_date`, and attribution.
 */

import type { IconName } from '@/components/Common/icons'
import { AUDIT_STATUS, statusMeta } from '@/services/inquiryEnums'

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
        // Rejections recorded before `report.dossier_event` existed kept their
        // motivation nowhere but the mail, so point at both.
        detail:
          'De beoordelaar heeft het dossier teruggestuurd. De reden staat in de tijdlijn, of anders in de mail aan de opsteller.',
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
 * Mirrors `LegacyDossierEvent` in `FunderMapsApi/src/lib/dossier-events.ts`,
 * served by `GET /api/inquiry/:id/events` and the recovery equivalent, oldest
 * first. `imported` and `proposed` are the Data Ops pipeline's entries (see
 * `FunderMapsWorker/docs/dataops-pipeline.md`): a dossier that arrived as a
 * document rather than being typed, and a field the pipeline filled in.
 */
export type DossierEventKind =
  'created' | 'submitted' | 'approved' | 'rejected' | 'reopened' | 'imported' | 'proposed'

export interface DossierEvent {
  kind: DossierEventKind
  date: string
  /** Null for machine actors and for accounts deleted since. */
  actorName: string | null
  /** Human prose the event carried — a rejection motivation, an import source. */
  note: string | null
  metadata: Record<string, unknown> | null
}

export interface DossierEventMeta {
  label: string
  icon: IconName
  /** Tailwind text colour for the marker. */
  tone: string
}

/**
 * Only `rejected` gets a colour. A trail where every row shouts is a trail
 * nobody scans; the one entry that means "this came back" should be the one
 * that catches the eye.
 */
export const EVENT_META: Record<DossierEventKind, DossierEventMeta> = {
  created: { label: 'Aangemaakt', icon: 'clipboard', tone: 'text-grey-700' },
  submitted: { label: 'Aangeboden ter controle', icon: 'arrowRight', tone: 'text-grey-700' },
  approved: { label: 'Goedgekeurd', icon: 'check', tone: 'text-green-700' },
  rejected: { label: 'Afgekeurd', icon: 'alert', tone: 'text-red-800' },
  reopened: { label: 'Heropend', icon: 'switch', tone: 'text-grey-700' },
  imported: { label: 'Geïmporteerd', icon: 'plus', tone: 'text-grey-700' },
  proposed: { label: 'Voorgesteld door de pijplijn', icon: 'target', tone: 'text-grey-700' },
}

export function eventMeta(kind: string): DossierEventMeta {
  return (
    EVENT_META[kind as DossierEventKind] ?? {
      label: kind,
      icon: 'info',
      tone: 'text-grey-700',
    }
  )
}

/**
 * `reset` records the state it pulled the dossier out of, because reopening an
 * approved dossier is a different act from reopening a rejected one and the
 * status column cannot tell them apart afterwards.
 */
/**
 * `metadata.from` carries the raw PG enum label (`done`, `pending_review`, …)
 * because that is what the API read off the column. Translate it through the
 * same table the status pill uses, so a trail entry and a badge never disagree.
 */
const PG_STATUS_TO_INT: Record<string, number> = {
  todo: AUDIT_STATUS.TODO,
  pending: AUDIT_STATUS.PENDING,
  done: AUDIT_STATUS.DONE,
  discarded: AUDIT_STATUS.DISCARDED,
  pending_review: AUDIT_STATUS.PENDING_REVIEW,
  rejected: AUDIT_STATUS.REJECTED,
}

export function statusLabelFor(pgLabel: string): string {
  const value = PG_STATUS_TO_INT[pgLabel]
  return value === undefined ? pgLabel : statusMeta(value).label
}

export function reopenedFrom(event: DossierEvent): string | null {
  const from = event.metadata?.from
  return typeof from === 'string' ? from : null
}
