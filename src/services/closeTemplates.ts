/**
 * Standard answers for closing a dossier (Don, 2026-09-17: "do 1 and 2").
 *
 * The reason typed at Afwijzen / Geen gegevens / Sluiten goes into the mail
 * to the melder verbatim, so it has to read as a letter, not as a log line.
 * Of the eight rejections in the week of 15 September, six were one of the
 * situations below, typed out by hand each time. Picking one fills the note;
 * the reviewer edits it per case and chooses the outcome as before.
 *
 * Texts are addressed to the melder ("u"). Keep them short: the mail already
 * carries the meldcode, the status link and the reply line.
 *
 * v1 lives in code; v2 makes them editable in the Studio (see ClientApp #354
 * for the drafted-mail path this complements).
 *
 * The two QuickScan texts come from Don's brief of 2026-09-17 (Worker #149) and
 * are confirmed by him. "Already processed" carries three blanks the reviewer
 * fills from the dossier: the QS-FOS reference, the execution date and the risk
 * in words (A/B laag, C midden, D/E hoog) — not the letter, which suggests a
 * precision we do not have at that moment. Recognised means: delivered through
 * FunderConsult.
 */
import type { DossierOutcome } from '@/services/fundermaps/interfaces/IDataops'

export interface CloseTemplate {
  value: string
  label: string
  /** The outcome this text usually goes with; shown as a hint, never forced. */
  outcome: DossierOutcome
  text: string
}

export const CLOSE_TEMPLATES: readonly CloseTemplate[] = [
  {
    value: 'quickscan_referral',
    label: 'QuickScan: via het FunderConsult-formulier',
    outcome: 'rejected',
    text:
      'U heeft een QuickScan (Fase 0) meegestuurd. Die verwerken wij via een andere route: ' +
      'https://funderconsult.com/feedback/form, optie “QuickScan of Fase 0-attest aanleveren”. ' +
      'Dit meldformulier is bedoeld voor wijzigingen op basis van een funderingsonderzoek, een archieftekening of een herstelbewijs.',
  },
  {
    value: 'quickscan_already_processed',
    label: 'QuickScan: staat al in de database',
    outcome: 'accepted',
    text:
      'Bedankt voor het toesturen van de QuickScan. Deze is al verwerkt in onze database ' +
      '(kenmerk QS-FOS-…, uitgevoerd op …). Uw pand staat daarmee op risico … (laag/midden/hoog). ' +
      'Wijzigt de risico-inschatting vanavond nog door onze modelberekening, dan laten wij dat weten.',
  },
  {
    value: 'quickscan_not_recognised',
    label: 'QuickScan: bureau niet erkend',
    outcome: 'rejected',
    text:
      'Het meegestuurde onderzoek is niet uitgevoerd door een erkend bureau. Wij mogen het daarom niet gebruiken ' +
      'om de registratie aan te passen; uw rapport bewaren wij wel. Een QuickScan door een erkend bureau vraagt u aan via ' +
      'https://funderconsult.com/quickscan#quickscan-aanvragen.',
  },
  {
    value: 'wrong_form',
    label: 'Verkeerd formulier gebruikt',
    outcome: 'rejected',
    text:
      'Dit formulier is bedoeld voor wijzigingen aan de Funderingsdatabase op basis van bewijsstukken: ' +
      'een funderingsonderzoek, een archieftekening of een herstelbewijs. Uw vraag past daar niet in. ' +
      'Voor andere vragen over funderingen kunt u terecht op https://funderconsult.com/feedback/form.',
  },
  {
    value: 'general_question',
    label: 'Algemene vraag, geen melding over een pand',
    outcome: 'rejected',
    text:
      'Uw bericht is een algemene vraag. Dit loket is er voor meldingen over een specifiek pand, met een document waaruit de ' +
      'wijziging blijkt. Algemene vragen over funderingen kunt u stellen via https://funderconsult.com/feedback/form.',
  },
  {
    value: 'risk_deviates_subsidence',
    label: 'Risico wijkt af door zakkingssnelheid',
    outcome: 'rejected',
    text:
      'Het funderingstype dat u noemt komt overeen met onze registratie. Het funderingsrisico van dit pand wordt echter ' +
      'niet alleen door het funderingstype bepaald: dit pand heeft een afwijkende zakkingssnelheid en valt daardoor in een ' +
      'andere risicocategorie. Wij passen het risico daarom niet aan.',
  },
  {
    value: 'data_correct',
    label: 'Onze gegevens kloppen',
    outcome: 'rejected',
    text:
      'Wij hebben uw melding beoordeeld. Voor dit pand gebruiken wij pandspecifieke gegevens over de fundering, de ondergrond ' +
      'en zakkingsmetingen. Die geven geen aanleiding om onze registratie aan te passen.',
  },
  {
    value: 'inspection_not_sufficient',
    label: 'Bouwkundige inspectie is geen funderingsonderzoek',
    outcome: 'rejected',
    text:
      'Voor het aanpassen van een funderingsrisico is een bouwkundige inspectie niet voldoende. Daarvoor is een ' +
      'funderingsonderzoek nodig (Fase 1 of Fase 2), uitgevoerd door een daarvoor erkend bureau. Stuurt u dat onderzoek, ' +
      'dan beoordelen wij uw melding opnieuw.',
  },
  {
    value: 'already_registered',
    label: 'Rapportage staat al in de database',
    outcome: 'accepted',
    text:
      'De rapportage die u meestuurde staat al in de Funderingsdatabase. Uw melding leidt daarom niet tot een wijziging; ' +
      'de gegevens van dit pand zijn er al op gebaseerd.',
  },
  {
    value: 'no_usable_data',
    label: 'Document gelezen, geen bruikbare gegevens',
    outcome: 'no_data',
    text:
      'Wij hebben het meegestuurde document bekeken, maar het bevat geen gegevens over de fundering die wij kunnen overnemen. ' +
      'Heeft u een funderingsonderzoek, een archieftekening of een herstelbewijs, stuur dat dan als antwoord op deze e-mail.',
  },
  {
    value: 'not_a_foundation_document',
    label: 'Geen funderingsdocument (advertentie, verkooprapport)',
    outcome: 'rejected',
    text:
      'Het meegestuurde document is geen funderingsdocument en zegt niets over de fundering van dit pand. ' +
      'Wij kunnen er daarom geen wijziging op baseren.',
  },
]

export const CLOSE_TEMPLATE_OPTIONS = CLOSE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))

export const OUTCOME_HINT: Record<DossierOutcome, string> = {
  rejected: 'Afwijzen',
  no_data: 'Geen gegevens',
  accepted: 'Sluiten zonder rapportage',
  duplicate: 'Duplicaat',
}
