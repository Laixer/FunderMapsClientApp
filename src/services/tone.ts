/**
 * The five voices the studio speaks in.
 *
 * Colour in this app is never decoration: green means *ours / settled*, blue
 * means *someone else is looking at it*, amber means *provisional*, red means
 * *this went wrong*, neutral means *no opinion*. A component that needs to
 * express one of those takes a `Tone` and looks up its classes here, so the
 * same status reads identically as a pill on a table row, a bar in the funnel,
 * a card border in the wizard and a dot in the sidebar.
 *
 * The maps hold whole literal class strings because Tailwind scans source text
 * — a computed `bg-${tone}-tint` produces no CSS at all.
 */

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'neutral'

/** Pill: a tinted lozenge with a dot in the ink colour. */
export const TONE_PILL: Record<Tone, string> = {
  green: 'bg-green-tint text-green-ink',
  blue: 'bg-blue-tint text-blue-ink',
  amber: 'bg-amber-tint text-amber-ink',
  red: 'bg-red-tint text-red',
  neutral: 'bg-canvas text-muted',
}

/** Solid dot — a status marker, a sparkline cap, a nav bullet. */
export const TONE_DOT: Record<Tone, string> = {
  green: 'bg-green',
  blue: 'bg-blue',
  amber: 'bg-amber',
  red: 'bg-red',
  neutral: 'bg-line-hover',
}

/** Progress-bar fill and other solid runs of colour. */
export const TONE_FILL: Record<Tone, string> = {
  green: 'bg-green',
  blue: 'bg-blue',
  amber: 'bg-amber',
  red: 'bg-red',
  neutral: 'bg-line-hover',
}

/** Text in the tone's darkest readable shade. */
export const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green-ink',
  blue: 'text-blue-ink',
  amber: 'text-amber-ink',
  red: 'text-red',
  neutral: 'text-muted',
}

/**
 * Callout: a washed card that explains something. Lighter than the pill tint —
 * a callout is a paragraph you read, not a label you glance at.
 */
export const TONE_CALLOUT: Record<Tone, string> = {
  green: 'bg-green-wash border-green-border',
  blue: 'bg-blue-tint border-blue-border',
  amber: 'bg-amber-wash border-amber-border',
  red: 'bg-red-tint border-red-border',
  neutral: 'bg-raised border-line',
}

/** Callout heading, one step darker than its body copy. */
export const TONE_CALLOUT_TITLE: Record<Tone, string> = {
  green: 'text-green-deep',
  blue: 'text-blue-ink',
  amber: 'text-amber-ink',
  red: 'text-red',
  neutral: 'text-strong',
}

export const TONE_CALLOUT_BODY: Record<Tone, string> = {
  green: 'text-green-soft',
  blue: 'text-blue-ink/85',
  amber: 'text-amber-soft',
  red: 'text-red-ink/85',
  neutral: 'text-muted',
}

/** Sparkline bars: the tone at low saturation, so the numeral stays the hero. */
export const TONE_SPARK: Record<Tone, string> = {
  green: 'bg-green-spark',
  blue: 'bg-blue-spark',
  amber: 'bg-amber-spark',
  red: 'bg-red-spark',
  neutral: 'bg-line',
}
