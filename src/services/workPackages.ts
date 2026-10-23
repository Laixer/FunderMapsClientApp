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
 * Since 2026-10-09 the admin can also compose a colleague's packages in the
 * Studio (the admin asked: the same set on every computer, without telling
 * people what to tick). That set lives in the database and wins over the
 * browser's (see `effectivePackageIds`); who holds what stays out of this
 * repository either way.
 *
 * Two things a filter does not do, stated so nobody assumes otherwise:
 *
 *  - It does not claim anything. A dossier has no owner, so two people whose
 *    packages overlap see the same dossiers and can both open one.
 *  - It is not the whole queue. Anything no package covers appears on nobody's
 *    Vandaag; it is still in Beoordelen.
 */

import api from '@/services/fundermaps'
import type { IQueueListOpts } from '@/services/fundermaps/endpoints/dataops'
import type { IQueueTrend } from '@/services/fundermaps/interfaces/IDataops'
import { BUILTIN_VIEWS, emptyQuery, toRouteQuery } from '@/services/reviewExplorer'

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
    // Archieven we may not search automatically (archieven.nl/MAIS-Flexis and
    // similar, robots.txt): per interesting pand a prepared search link in the
    // note (Don, 2026-09-26). Subject prefix "Archief zoeken:".
    id: 'archief-zoeken',
    title: 'Archief zoeken: zoeklink per pand',
    hint: 'Het model twijfelt; open de klaargezette zoeklink in het archief, haal de stukken op en upload ze bij het pand.',
    opts: { channel: ['api'], q: 'Archief zoeken' },
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

/**
 * The tab a package opens on: the first one asking for the same channel and
 * state. A search on "Alles" also finds closed dossiers (isWideSearch), so a
 * package with a search term showed 117 instead of its 6 open ones (Don,
 * 2026-10-20). Its own tab keeps it to open dossiers. Since the groups
 * (2026-10-22) every package has one; Alles is the fallback.
 */
const sameSet = (a: readonly string[] = [], b: readonly string[] = []) =>
  a.length === b.length && a.every((x) => b.includes(x))

function packageView(p: WorkPackage): string {
  const view = BUILTIN_VIEWS.find(
    (v) =>
      sameSet(v.query.channel, p.opts.channel) &&
      sameSet(v.query.state, p.opts.state) &&
      !v.query.outcome?.length &&
      !v.query.mine,
  )
  return view?.key ?? 'alles'
}

/** The package opened in Beoordelen, through the queue's own URL format. */
export function packageLink(p: WorkPackage) {
  const q = emptyQuery()
  if (p.opts.channel) q.channel = [...p.opts.channel]
  if (p.opts.state) q.state = [...p.opts.state]
  if (p.opts.kind) q.kind = [...p.opts.kind]
  if (p.opts.q) q.q = p.opts.q
  return { name: 'review-queue', query: toRouteQuery(q, packageView(p)) }
}

/**
 * A package that filters on how a dossier stands now (a question without a
 * document, the melder's reply) has no history to draw: the API refuses it
 * rather than paint today's answer over last month (2026-10-23).
 */
export const hasTrend = (p: WorkPackage) => !p.opts.state?.length

const trends = new Map<string, { at: number; trend: Promise<IQueueTrend | null> }>()

/**
 * The package over the last 30 days, or null (no history, or the API did not
 * answer). Vandaag asks for the same package twice — its own panel and the
 * overview — so one answer is kept for a minute.
 */
export function loadTrend(p: WorkPackage): Promise<IQueueTrend | null> {
  if (!hasTrend(p)) return Promise.resolve(null)
  const hit = trends.get(p.id)
  if (hit && Date.now() - hit.at < 60_000) return hit.trend
  const { q, channel, kind } = p.opts
  const trend = api.dataops.queueTrend({ q, channel, kind }).catch(() => null)
  trends.set(p.id, { at: Date.now(), trend })
  return trend
}

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
    return knownIds(ids)
  } catch {
    return []
  }
}

/** Only ids this Studio still defines; anything else (renamed, removed, garbage) is dropped. */
function knownIds(ids: unknown[]): string[] {
  const known = new Set(WORK_PACKAGES.map((p) => p.id))
  return ids.filter((id): id is string => typeof id === 'string' && known.has(id))
}

/**
 * The packages the admin composed for this user, or `[]` when there are none.
 *
 * `[]` also covers every failure, deliberately: an API that predates the
 * assignment answers 404, and a slow or broken one must not take Vandaag down
 * with it. Either way the user is back on the browser's own choice, which is
 * exactly how Vandaag worked before.
 */
export async function loadAssigned(): Promise<string[]> {
  try {
    const { packageIds } = await api.dataops.myWorkPackages()
    return Array.isArray(packageIds) ? knownIds(packageIds) : []
  } catch {
    return []
  }
}

/**
 * The packages that are this user's work: the admin's set when there is one,
 * else what was ticked in this browser. Vandaag and the sidebar count both go
 * through here, so the number next to "Vandaag" is the sum of what the page
 * shows.
 */
export async function effectivePackageIds(): Promise<{ ids: string[]; assigned: boolean }> {
  const assigned = await loadAssigned()
  return assigned.length
    ? { ids: assigned, assigned: true }
    : { ids: loadChosen(), assigned: false }
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
