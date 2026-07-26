/**
 * The three steps of the entry wizard, and where each one links to.
 *
 * Shared between the inquiry and recovery flows because they are the same
 * shape: describe the document, attach the addresses, check it over. Defined
 * once so the pills in all six views agree on their labels and on which of them
 * are reachable.
 *
 * A step is only linkable once the dossier exists — before the first save there
 * is no id to route to, so steps 2 and 3 render inert rather than as links that
 * 404.
 */

import type { WizardStep } from '@/components/Common/StepPills.vue'

/**
 * Step 2 is named after what it actually collects, which differs between the
 * two flows: an inquiry records observations per *address*, a recovery records
 * work done on a *pand*. The rest of both screens already uses those words, and
 * a step pill that disagrees with the pane it leads to is a small lie repeated
 * on every visit.
 */
const LABELS = {
  inquiry: ['Gegevens', 'Adressen', 'Controle'],
  recovery: ['Gegevens', 'Panden', 'Controle'],
} as const

function steps(flow: 'inquiry' | 'recovery', id: number | null): WizardStep[] {
  return LABELS[flow].map((label, i) => ({
    label,
    to: id === null ? undefined : { name: `${flow}-edit-${i + 1}`, params: { id } },
  }))
}

export function inquirySteps(id: number | null): WizardStep[] {
  return steps('inquiry', id)
}

export function recoverySteps(id: number | null): WizardStep[] {
  return steps('recovery', id)
}
