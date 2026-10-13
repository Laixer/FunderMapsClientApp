/**
 * Ask before a form with unsaved input is left.
 *
 * Three forms lost what was typed without a word: a click on a sidebar link,
 * the browser's Back, a closed tab. This asks first, and only then: a form that
 * was merely opened, or that has been saved, lets you go.
 *
 * "Changed" is a comparison, not a flag. The form hands over what a save would
 * send (`state`), and it is dirty while that differs from the last known-good
 * copy: what was loaded, or what was saved. So typing a word and taking it out
 * again is not a change, and a flag cannot go stale.
 *
 * Two ways out are covered, because they are two different mechanisms:
 *
 * - Inside the app: a router guard that asks through `confirmAction`. It is a
 *   `beforeEach` that lives as long as the component, not `onBeforeRouteLeave`:
 *   that one is tied to the route record the component was set up under, and
 *   the herstel form moves from "create" to "edit" on its first save without
 *   being set up again, so its guard would be left behind on the old record.
 *   When the answer is "stay" after the browser's Back, the router itself puts
 *   the address back.
 * - Closing or reloading the tab: `beforeunload`, where the browser asks in its
 *   own words. Registered only while there is something to lose; a page with
 *   that listener always on is one the browser may refuse to keep for Back.
 */

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { confirmAction } from '@/services/confirm'

export function useUnsavedChanges(state: () => unknown) {
  const router = useRouter()

  /** The form as one comparable string. */
  const snapshot = () => JSON.stringify(state())

  const baseline = ref(snapshot())
  const dirty = computed(() => snapshot() !== baseline.value)

  /**
   * The form is as stored: call it once the record has been loaded into the
   * form, and after a save. After a save, pass the snapshot taken *before* the
   * request: what was typed while it was under way has not been saved.
   */
  function markSaved(saved: string = snapshot()) {
    baseline.value = saved
  }

  let leaving = false

  /**
   * A move the form makes itself, where there is nothing left to ask: after
   * "Annuleren" (leaving was the choice), or to the place a save leads.
   */
  async function leave<T>(navigate: () => Promise<T>): Promise<T> {
    leaving = true
    try {
      return await navigate()
    } finally {
      leaving = false
    }
  }

  /** The question that is on screen now, if any. */
  let question: Promise<boolean> | null = null

  const removeGuard = router.beforeEach((to, from) => {
    if (leaving || !dirty.value) return true
    // Not a way out: the router stepping the address back to this page after a
    // "stay" can arrive here as a navigation to where we already are.
    if (to.fullPath === from.fullPath) return true
    // One question at a time. Back pressed again while it is open gets the same
    // answer rather than a second dialog: `confirmAction` would decline the
    // first, the router would then step the address forward for it, and
    // "Verlaten" on the second would show one page under another's address.
    // Escape and a click beside the dialog both answer "no", which is "stay".
    question ??= confirmAction({
      title: 'Wijzigingen niet opgeslagen',
      body: 'Wat je hier hebt ingevuld of gewijzigd is nog niet opgeslagen. Verlaat je de pagina, dan gaat het verloren.',
      confirmLabel: 'Verlaten',
      cancelLabel: 'Blijven',
      danger: true,
      // Enter stays: the question interrupts, and a reflex must not lose the input.
      cautious: true,
    }).finally(() => (question = null))
    return question
  })

  function onBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault()
    // Chrome before 119 only asks when this is set.
    event.returnValue = ''
  }

  watch(
    dirty,
    (now) => {
      if (now) window.addEventListener('beforeunload', onBeforeUnload)
      else window.removeEventListener('beforeunload', onBeforeUnload)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    removeGuard()
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  return { dirty, snapshot, markSaved, leave }
}
