/**
 * The three steps of the recovery entry wizard, and where each one links to.
 *
 * The inquiry flow had the same shape until 2026-09-07, when its front door
 * became the review lane (a document is read by the pipeline and judged, not
 * typed); its two remaining pages are plain edit forms, not steps. Recovery
 * has no pipeline yet, so its wizard stays.
 *
 * A step is only linkable once the dossier exists — before the first save there
 * is no id to route to, so steps 2 and 3 render inert rather than as links that
 * 404.
 */

import type { WizardStep } from '@/components/Common/StepPills.vue'

/** Step 2 is named after what it collects: a recovery records work done on a *pand*. */
const LABELS = ['Gegevens', 'Panden', 'Controle'] as const

export function recoverySteps(id: number | null): WizardStep[] {
  return LABELS.map((label, i) => ({
    label,
    to: id === null ? undefined : { name: `recovery-edit-${i + 1}`, params: { id } },
  }))
}
