/**
 * Hold the keyboard inside an overlay while it is up, and give the focus back
 * when it closes.
 *
 * An overlay that says `aria-modal="true"` promises this. Without it Tab walks
 * the page behind the sheet (a confirm dialog open, focus on a sidebar link),
 * and after Escape the focus is lost to the top of the document.
 *
 * Focus starts on the element marked `data-autofocus`, else on the first form
 * control (a dialog with a text box is there to be typed in), else on the first
 * button.
 *
 * Returns the function that releases the trap and restores the focus.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function trapFocus(container: HTMLElement): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null

  const focusable = () =>
    [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)

  const start =
    container.querySelector<HTMLElement>('[data-autofocus]') ??
    container.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ??
    focusable()[0] ??
    container
  start.focus()

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const list = focusable()
    const first = list[0]
    const last = list[list.length - 1]
    if (!first || !last) {
      event.preventDefault()
      return
    }
    const active = document.activeElement
    if (!container.contains(active)) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', onKeydown, true)

  return () => {
    document.removeEventListener('keydown', onKeydown, true)
    if (previous && document.contains(previous)) previous.focus()
  }
}
