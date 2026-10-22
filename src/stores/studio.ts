import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import api from '@/services/fundermaps'
import type { IStudioToday } from '@/services/fundermaps/interfaces/IDataops'
import {
  BUILTIN_VIEWS,
  DEFAULT_VIEW,
  customViews,
  defaultView,
  fromView,
  toCountOpts,
  viewGroups,
  type SavedView,
} from '@/services/reviewExplorer'
import { effectivePackageIds, packagesFor } from '@/services/workPackages'
import { useSessionStore } from '@/stores/session'

/**
 * Shell-level state: the counts in the sidebar, and whether the command
 * palette is up.
 *
 * The counts are here rather than on the Werkbank because the sidebar is
 * always on screen and the Werkbank is not — a queue that only updates when
 * you happen to be looking at it is a queue you stop trusting. They refresh on
 * demand after any action that could move a dossier between statuses.
 *
 * `null` means "not counted yet" and renders as nothing. That is deliberate:
 * a zero next to "Werkbank" is a claim that your queue is empty, and this
 * store should never make that claim on the strength of a request that has not
 * come back.
 */
export const useStudioStore = defineStore('studio', () => {
  const paletteOpen = ref(false)

  const werkbank = ref<number | null>(null)
  const inquiries = ref<number | null>(null)
  const recoveries = ref<number | null>(null)
  const controle = ref<number | null>(null)

  let inFlight: Promise<void> | null = null

  const counts = computed<Record<string, number | null>>(() => ({
    werkbank: werkbank.value,
    inquiries: inquiries.value,
    recoveries: recoveries.value,
    controle: controle.value,
  }))

  /**
   * Controle's views, built in and saved in this browser, and the number on
   * each. Here rather than on the page: since 2026-10-22 the sidebar lists
   * them under Controle like an inbox's folders, so the rail and the page
   * read one list and one set of counts.
   */
  const reviewViews = ref<SavedView[]>([...BUILTIN_VIEWS, ...customViews()])
  const reviewGroups = computed(() => viewGroups(reviewViews.value.filter((v) => !v.builtin)))
  const viewCounts = ref<Record<string, number | null>>({})

  function reloadReviewViews() {
    reviewViews.value = [...BUILTIN_VIEWS, ...customViews()]
  }

  let viewCountToken = 0
  let viewCountsAt = 0

  /**
   * The number on every view: its own question, without whatever is filtered
   * or typed on top of it, as on the Vandaag tiles. Views asking the same
   * (Wachtrij and Meldingen differ only in their order) share one request.
   * `maxAge` skips a refresh younger than that: the sidebar mounts again with
   * every page, and opening a dossier and going back is no reason to ask again.
   */
  async function refreshViewCounts(maxAge = 0): Promise<void> {
    if (maxAge && Date.now() - viewCountsAt < maxAge) return
    viewCountsAt = Date.now()
    const token = ++viewCountToken
    const asked = new Map<string, Promise<number | null>>()
    await Promise.all(
      reviewViews.value.map((view) => {
        const opts = toCountOpts(fromView(view), view.key)
        const sig = JSON.stringify(opts)
        if (!asked.has(sig)) {
          asked.set(
            sig,
            api.dataops.queueCount(opts).then(
              (r) => r.count,
              () => null,
            ),
          )
        }
        return asked.get(sig)!.then((n) => void (token === viewCountToken && (viewCounts.value[view.key] = n)))
      }),
    )
  }

  /**
   * The studio's pulse (2026-10-22): today's work by the machines and the people
   * and what waits (/dataops/today). Vandaag draws it in full, the top bar of
   * every other page in one line. At most once a minute, like the view counts;
   * a failed or missing endpoint keeps the last answer and the bar stays quiet.
   */
  const pulse = ref<IStudioToday | null>(null)
  let pulseAt = 0
  async function refreshPulse(maxAge = 60_000): Promise<void> {
    if (maxAge && Date.now() - pulseAt < maxAge) return
    pulseAt = Date.now()
    try {
      pulse.value = await api.dataops.today()
    } catch {
      /* keep the last pulse */
    }
  }

  /**
   * Refresh every counter for the given user.
   *
   * Each source is allowed to fail on its own: the sidebar losing one number is
   * a much smaller problem than the sidebar losing all three because
   * `/recovery/stats` was slow. Concurrent calls share one flight — mounting
   * three views in a row should not fire nine requests.
   */
  async function refreshCounts(userId: string | null | undefined): Promise<void> {
    if (inFlight) return inFlight

    inFlight = (async () => {
      const jobs: Promise<void>[] = [
        api.inquiry
          .getCount()
          .then(({ count }) => void (inquiries.value = count))
          .catch(() => {}),
        api.recovery
          .getCount()
          .then(({ count }) => void (recoveries.value = count))
          .catch(() => {}),
        // The melders waiting for an answer, i.e. Controle's first tab; not the
        // whole desk. Until 2026-10-22 this was every open dossier, 1,054, of
        // which 664 were the archive drop and 205 Fundie's archive leads: the
        // 34 with somebody waiting were in there, but nobody could tell.
        api.dataops
          .queueCount(toCountOpts(fromView(defaultView()), DEFAULT_VIEW))
          .then(({ count }) => void (controle.value = count))
          .catch(() => {}),
      ]
      // The views under Controle, on every page (2026-10-22). A caller passing
      // null comes from a review action (see below), and that is when these
      // numbers move: count again. Every page's shell refreshes too, where a
      // minute-old count is fresh enough.
      jobs.push(refreshViewCounts(userId === null ? 0 : 60_000))
      jobs.push(refreshPulse(userId === null ? 0 : 60_000))

      // The number next to "Vandaag" is the work in your packages plus the
      // dossiers handed to you, i.e. what the Vandaag page puts in front of
      // you. Until 2026-10-09 it summed the old rapportage lanes (report.inquiry
      // with you as reviewer in pending_review etc., services/worklist.ts),
      // which for the admin was 11,163 rapportages of backlog going back to
      // 2019 while the whole review queue ("Controle") was 1,146: a number
      // nobody could act on. The admin asked for it to count the packages.
      //
      // A dossier two packages cover, or one in a package and also handed to
      // you, counts twice. The queue has no "any of these filters" query, and
      // the page shows it twice too, so the sum matches what you see.
      //
      // The user id is no longer part of the query (the API reads you from the
      // session); it still says "someone is signed in", falling back to the
      // session for the callers that pass null after a review action -- which
      // is exactly when this number moves.
      if (userId ?? useSessionStore().currentUser?.id) {
        jobs.push(
          effectivePackageIds()
            .then(({ ids }) =>
              Promise.all([
                ...packagesFor(ids).map((p) => api.dataops.queueCount(p.opts)),
                api.dataops.queueCount({ assignedTo: 'me' }),
              ]),
            )
            .then((results) => void (werkbank.value = results.reduce((n, r) => n + r.count, 0)))
            .catch(() => {}),
        )
      }

      await Promise.all(jobs)
    })().finally(() => {
      inFlight = null
    })

    return inFlight
  }

  function openPalette() {
    paletteOpen.value = true
  }

  function closePalette() {
    paletteOpen.value = false
  }

  function togglePalette() {
    paletteOpen.value = !paletteOpen.value
  }

  return {
    paletteOpen,
    counts,
    werkbank,
    inquiries,
    controle,
    recoveries,
    refreshCounts,
    reviewViews,
    reviewGroups,
    viewCounts,
    reloadReviewViews,
    refreshViewCounts,
    pulse,
    refreshPulse,
    openPalette,
    closePalette,
    togglePalette,
  }
})
