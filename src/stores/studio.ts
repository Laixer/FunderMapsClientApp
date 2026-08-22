import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import api from '@/services/fundermaps'
import { LANES, laneQuery } from '@/services/worklist'

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
        // The review queue has no count endpoint of its own: the queue is
        // capped at 200 and a reviewer works it down, so its length is the
        // number. One request instead of two.
        api.dataops
          .queue()
          .then((rows) => void (controle.value = rows.length))
          .catch(() => {}),
      ]

      if (userId) {
        jobs.push(
          Promise.all(LANES.map((lane) => api.inquiry.list(laneQuery(lane, userId))))
            .then((results) => void (werkbank.value = results.reduce((n, r) => n + r.length, 0)))
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
