/**
 * Look up an address when its row comes into view, and not before.
 *
 * A herstel can hold thousands of panden, and the record screen used to
 * resolve every one of them before it showed anything: one geocoder request
 * per pand, 822 of them for a record of 1,885 rows, ten seconds of "Dossier
 * ophalen…". Nobody reads 1,885 rows; they read the twenty on screen.
 *
 * So a row registers its element here and the address is asked for once the
 * row is in (or near) the window and the scrolling has paused: rows that only
 * fly past cost nothing. The answer lands in the address store's cache, which
 * every row of that pand reads.
 *
 * No id is asked for twice, in flight or failed: the store does not remember a
 * failed lookup, and a pand the geocoder does not know (there are a few) would
 * otherwise be asked again on every scroll. The memory is dropped when the
 * last row leaves the screen, so a failed lookup gets a new chance on the next
 * visit.
 */
import { useAddressStore } from '@/stores/address'

/** How far outside the window a row already counts: about half a screen, so a short scroll lands on addresses. */
const MARGIN = '400px 0px'
/** How long the scrolling must rest before the rows in view are looked up. */
const SETTLE_MS = 150

const watched = new Map<Element, string>()
const inView = new Set<Element>()
const asked = new Set<string>()

let observer: IntersectionObserver | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function lookUp() {
  const store = useAddressStore()
  for (const el of inView) {
    const id = watched.get(el)
    if (!id) continue
    if (!store.cache[id] && !asked.has(id)) {
      asked.add(id)
      void store.getById(id)
    }
    // Asked for or already known: there is nothing more to watch this row for.
    observer?.unobserve(el)
    inView.delete(el)
  }
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    if (entry.isIntersecting) inView.add(entry.target)
    else inView.delete(entry.target)
  }
  clearTimeout(timer)
  timer = setTimeout(lookUp, SETTLE_MS)
}

/**
 * Resolve the address of `id` once `el` is on screen. Returns the function
 * that stops watching (call it when the row goes away).
 */
export function resolveWhenVisible(el: Element, id: string): () => void {
  // Made on first use: there is no IntersectionObserver where nothing is on screen (a server render).
  observer ??= new IntersectionObserver(onIntersect, { rootMargin: MARGIN })
  watched.set(el, id)
  observer.observe(el)

  return () => {
    observer?.unobserve(el)
    watched.delete(el)
    inView.delete(el)
    if (!watched.size) asked.clear()
  }
}
