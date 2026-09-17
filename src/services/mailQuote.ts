/**
 * Splits a melder's mail reply into what they wrote and the quoted history
 * underneath (#356: Don, 2026-09-17: hide the quoted part by default, one
 * click to show).
 *
 * Patterns seen in dataops.dossier_entry replies (September 2026): Outlook NL
 * ("Van: … / Verzonden:" or "Datum:"), Outlook EN ("From: … / Sent:"), Gmail NL/EN
 * ("Op … schreef …:", "On … wrote:"), "-----Oorspronkelijk bericht-----", and
 * ">"-prefixed lines. The first marker wins; no marker means no quoted part.
 */
export interface SplitMail {
  own: string
  quoted: string
}

const MARKERS: RegExp[] = [
  // Outlook: a header block of at least two lines. "Van:" may trail a signature
  // on the same line (disclaimer text runs straight into it).
  /(?<=^|\s)(Van|From):[^\n]*\n[ \t]*(Verzonden|Datum|Sent|Date):/im,
  // Gmail / Apple Mail: one line with a digit (date) ending in schreef/wrote + colon.
  /^[ \t]*Op [^\n]*\d[^\n]*(schreef|het volgende geschreven)[^\n]*:[ \t]*$/im,
  /^[ \t]*On [^\n]*\d[^\n]*wrote:[ \t]*$/im,
  /^[ \t]*-{2,}[ \t]*(Oorspronkelijk bericht|Original Message)[ \t]*-{2,}/im,
  // A run of ">" quoted lines.
  /^>[^\n]*(\n>[^\n]*)+/m,
]

export function splitQuoted(text: string | null | undefined): SplitMail {
  const src = text ?? ''
  let cut = -1
  for (const re of MARKERS) {
    const m = re.exec(src)
    if (m && (cut === -1 || m.index < cut)) cut = m.index
  }
  if (cut <= 0) return { own: src.trim(), quoted: '' }
  // Outlook puts a line of underscores above the header block; it belongs to the quote.
  const own = src.slice(0, cut).replace(/\s+$/, '').replace(/\n[ \t]*_{8,}[ \t]*$/, '').replace(/\s+$/, '')
  return { own, quoted: src.slice(cut).trim() }
}

/** Collapses the blank-line padding mail clients add (3+ newlines → one empty line). */
export function tidyMailText(text: string): string {
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
