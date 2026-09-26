/**
 * Werkpakketten: a named slice of the review queue, for the Vandaag page.
 *
 * Don, 2026-09-22: give each invoerder a work package on the landing page —
 * people have different strengths and different hours, and the review queue
 * shows everyone everything. A package is one filter combination the queue
 * endpoint already understands; a person picks the packages that are theirs,
 * and Vandaag shows each of them oldest first.
 *
 * Deliberately named after the WORK, never after a person. This repository is
 * public, and who does which work is not something to publish. Don hands the
 * packages out by telling people which ones to tick; the choice is kept in
 * that person's browser (see `loadChosen`).
 *
 * Two things a filter does not do, stated so nobody assumes otherwise:
 *
 *  - It does not claim anything. A dossier has no owner, so two people whose
 *    packages overlap see the same dossiers and can both open one.
 *  - It is not the whole queue. Anything no package covers appears on nobody's
 *    Vandaag; it is still in Beoordelen.
 */

import type { IQueueListOpts } from '@/services/fundermaps/endpoints/dataops'

export interface WorkPackage {
  id: string
  title: string
  /** One line under the title: what lands here, in the reviewer's words. */
  hint: string
  /** Handed to `GET /dataops/queue` and its count as-is. */
  opts: Pick<IQueueListOpts, 'channel' | 'state' | 'kind' | 'q'>
}

/**
 * The melder's topic is stored as the dossier's subject — the intake writes
 * `subject: topicLabel`, and the mapping is one-to-one on every portal
 * dossier (checked 2026-09-22). The queue has no topic filter, so these go
 * through its search, which matches the subject.
 */
const TOPIC = {
  foundationType: 'Het funderingstype klopt niet',
  noDamage: 'Het funderingsrisico klopt niet',
  other: 'Iets anders',
} as const

export const WORK_PACKAGES: readonly WorkPackage[] = [
  {
    id: 'meldingen-funderingstype',
    title: 'Meldingen: funderingstype klopt niet',
    hint: 'Een melder zegt dat er iets anders onder het pand zit.',
    opts: { channel: ['upload'], q: TOPIC.foundationType },
  },
  {
    id: 'meldingen-funderingsrisico',
    title: 'Meldingen: funderingsrisico klopt niet',
    hint: 'Een melder vindt het risico te hoog of te laag.',
    opts: { channel: ['upload'], q: TOPIC.noDamage },
  },
  {
    id: 'meldingen-overig',
    title: 'Meldingen: iets anders',
    hint: 'Vragen en meldingen die nergens anders onder vallen.',
    opts: { channel: ['upload'], q: TOPIC.other },
  },
  {
    id: 'nalezing-funderingsonderzoek',
    title: 'Nalezing: funderingsonderzoek',
    hint: 'Een bestaande rapportage opnieuw gelezen, soort funderingsonderzoek.',
    opts: { channel: ['audit'], kind: ['foundation_research'] },
  },
  {
    id: 'nalezing-archiefonderzoek',
    title: 'Nalezing: archiefonderzoek',
    hint: 'Een bestaande rapportage opnieuw gelezen, soort archiefonderzoek.',
    opts: { channel: ['audit'], kind: ['archive_research'] },
  },
  {
    // Every document kind, not only archive research: the drop is a channel,
    // and on 2026-09-22 its 1,359 open dossiers were 526 unread, 366 QuickScan,
    // 206 notes and only 115 archive research. Don: "de 1359 zitten hier".
    id: 'archiefverwerking',
    title: 'Archiefverwerking',
    hint: 'De archiefdrop, alle soorten documenten.',
    opts: { channel: ['bulk_drop'] },
  },
  {
    id: 'studio-uploads',
    title: 'Studio-uploads',
    hint: 'Documenten die een collega via Studio heeft aangeleverd.',
    opts: { channel: ['invoer_app'] },
  },
  {
    // Archiefwijzer pilot (Don, 2026-09-26): panden where the two foundation-type
    // models disagree and an archive E-loket or the Amsterdam API lists a
    // bouwdossier. Created by Fundie on channel `api`; the dossier's note holds
    // the direct links. The work: fetch the stukken, upload them at the pand.
    id: 'archiefwijzer',
    title: 'Archiefwijzer: bouwdossiers ophalen',
    hint: 'Het model twijfelt en een archief heeft een bouwdossier. Open de link, haal de stukken op en upload ze bij het pand.',
    opts: { channel: ['api'], q: 'Archiefwijzer' },
  },
  {
    id: 'vragen',
    title: 'Vragen zonder document',
    hint: 'Een melder stelt een vraag en stuurde niets mee.',
    // Scoped to the portal, exactly as Beoordelen's own "Vragen" view is.
    opts: { channel: ['upload'], state: ['question'] },
  },
  {
    // `replied` spans open and closed dossiers on purpose (API queueScope): the
    // reply most in need of an answer is the one on a dossier already closed.
    id: 'reacties',
    title: 'Reactie ontvangen',
    hint: 'De melder heeft het laatste woord, ook op afgesloten dossiers.',
    opts: { state: ['replied'] },
  },
] as const

/** Rows shown per package before "alles bekijken". */
export const PACKAGE_PREVIEW = 5

const STORAGE_KEY = 'vandaag.packages'

/**
 * The packages this browser's user picked. Unknown ids — a package renamed or
 * removed since — are dropped rather than failing the page.
 *
 * Storage can be absent or throw (private window, blocked site data); the page
 * then simply asks again.
 */
export function loadChosen(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const ids = JSON.parse(raw)
    if (!Array.isArray(ids)) return []
    const known = new Set(WORK_PACKAGES.map((p) => p.id))
    return ids.filter((id): id is string => typeof id === 'string' && known.has(id))
  } catch {
    return []
  }
}

export function saveChosen(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Not remembered across visits; the choice still holds for this one.
  }
}

/** The packages for these ids, in catalogue order rather than click order. */
export function packagesFor(ids: string[]): WorkPackage[] {
  const chosen = new Set(ids)
  return WORK_PACKAGES.filter((p) => chosen.has(p.id))
}
