import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import api from '@/services/fundermaps'
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
        api.dataops
          .queueCount()
          .then(({ count }) => void (controle.value = count))
          .catch(() => {}),
      ]

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
    openPalette,
    closePalette,
    togglePalette,
  }
})
