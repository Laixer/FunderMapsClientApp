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
  counter?: 'werkbank' | 'inquiries' | 'recoveries' | 'controle'
}

export interface NavGroup {
  /** Small caption over the group; none for the single row at the top. */
  title: string
  items: NavItem[]
  /** In Ctrl+K and the `g` keys, but not a row in the rail. */
  hidden?: boolean
}

/**
 * The rail in four parts (2026-10-22, "a cohesive structure"): your day; how
 * the data flows (INZICHT); what is in FunderMaps (GEGEVENS); what needs doing
 * (WERK). WERK comes last because Controle carries its views, the one list in
 * the rail that can grow: on a short window only its tail scrolls, never a
 * place.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: '',
    items: [{ route: 'home', label: 'Vandaag', key: 'w', counter: 'werkbank' }],
  },
  {
    title: 'INZICHT',
    items: [
      // Where everything that came in went (2026-10-22).
      { route: 'dataflow', label: 'Datastroom', key: 'd' },
      // How the model runs and what it says now (2026-10-22).
      { route: 'models', label: 'Modellen', key: 'm' },
    ],
  },
  {
    title: 'GEGEVENS',
    items: [
      { route: 'inquiry-list', label: 'Rapportages', key: 'r', counter: 'inquiries' },
      { route: 'recovery-list', label: 'Herstel', key: 'h', counter: 'recoveries' },
    ],
  },
  {
    title: 'WERK',
    items: [
      // The desk the day starts at now that documents arrive through the portal
      // (Yorick, 2026-08-31); its views hang under it.
      { route: 'review-queue', label: 'Controle', key: 'c', counter: 'controle' },
    ],
  },
  {
    // Making a record by hand is an action, not a place: the Rapportages and
    // Herstel headers carry the buttons, Ctrl+K and `g n` / `g e` still go there.
    title: 'NIEUW',
    hidden: true,
    items: [
      { route: 'inquiry-new', label: 'Nieuwe rapportage', key: 'n' },
      { route: 'recovery-new', label: 'Nieuw herstel', key: 'e' },
    ],
  },
]

/**
 * Which rail row owns a route. The wizard steps and the detail views are not
 * destinations of their own — inside a rapportage the rail still says
 * *Rapportages* rather than go blank.
 */
export const OWNED_BY: Record<string, string> = {
  home: 'home',
  dataflow: 'dataflow',
  models: 'models',
  'inquiry-list': 'inquiry-list',
  'inquiry-view': 'inquiry-list',
  'inquiry-edit-details': 'inquiry-list',
  'inquiry-edit-samples': 'inquiry-list',
  'inquiry-new': 'inquiry-list',
  'recovery-list': 'recovery-list',
  'recovery-view': 'recovery-list',
  'recovery-edit-1': 'recovery-list',
  'recovery-edit-2': 'recovery-list',
  'recovery-edit-3': 'recovery-list',
  'recovery-new': 'recovery-list',
  'review-queue': 'review-queue',
  'review-dossier': 'review-queue',
}

/** Pages that belong to a part of the rail without a row of their own. */
const SECTION_OF: Record<string, string> = { building: 'GEGEVENS' }

const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

/**
 * The top bar's trail for a route: the part of the rail, then the row that
 * owns the page when the page is not that row itself (a link back to it).
 * The page's own name follows, from the page.
 */
export function crumbTrail(routeName: string): { label: string; route?: string }[] {
  const owner = OWNED_BY[routeName]
  const group = owner
    ? NAV_GROUPS.find((g) => g.items.some((i) => i.route === owner))
    : NAV_GROUPS.find((g) => g.title === SECTION_OF[routeName])
  const trail: { label: string; route?: string }[] = []
  if (group?.title) trail.push({ label: sentenceCase(group.title) })
  const item = owner ? group?.items.find((i) => i.route === owner) : undefined
  if (item && item.route !== routeName) trail.push({ label: item.label, route: item.route })
  return trail
}

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

/** `g` + key → route name, for the global shortcut handler. */
export const GOTO_ROUTES: Record<string, { route: string; label: string }> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.key, { route: item.route, label: item.label }]),
)
