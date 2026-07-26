/**
 * The sidebar's contents, declared once.
 *
 * Also the source for the command palette's "GA NAAR" rows and for the `g`
 * shortcut sequences, so a destination cannot exist in one of the three and be
 * missing from the others. Adding a screen means adding a line here.
 *
 * The Dutch mnemonics are chosen so the two that sit next to each other in the
 * sidebar stay distinct: `g r` is *rapportages*, `g h` is *herstel*.
 */

export interface NavItem {
  /** Route name. */
  route: string
  label: string
  /** Second key of the `g` sequence that jumps here. */
  key: string
  /**
   * Which counter, if any, the sidebar shows on the right of this row. The
   * store fills these in; a route with no counter simply shows nothing rather
   * than a zero it cannot vouch for.
   */
  counter?: 'werkbank' | 'inquiries' | 'recoveries'
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: 'WERK',
    items: [
      { route: 'home', label: 'Werkbank', key: 'w', counter: 'werkbank' },
      { route: 'inquiry-list', label: 'Rapportages', key: 'r', counter: 'inquiries' },
      { route: 'recovery-list', label: 'Herstel', key: 'h', counter: 'recoveries' },
    ],
  },
  {
    title: 'NIEUW',
    items: [
      { route: 'inquiry-new', label: 'Nieuwe rapportage', key: 'n' },
      { route: 'recovery-new', label: 'Nieuw herstel', key: 'e' },
    ],
  },
]

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

/** `g` + key → route name, for the global shortcut handler. */
export const GOTO_ROUTES: Record<string, { route: string; label: string }> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.key, { route: item.route, label: item.label }]),
)
