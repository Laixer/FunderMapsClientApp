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
 * The QuickScan texts come from Don's brief of 2026-09-17 (Worker #149) and
 * are confirmed by him; the risk goes in words (laag, midden, hoog), not the
 * letter, which suggests a precision we do not have at that moment.
 * Recognised means: delivered through FunderConsult.
 *
 * v1.1 (Don, 2026-10-02, "Prima, voeg toe", after two weeks of closing notes):
 * the QuickScan answer comes per risk level (it was completed by hand ten
 * times), the recognition answer covers any research, the subsidence answer
 * no longer assumes a foundation-type complaint, and eight answers cover what
 * was typed by hand or waits in the queue. `asMessage` marks the ones that
 * also fit the "Bericht aan de melder" box, where the dossier stays open
 * ("Inderdaad ook bij de reactie vraag"). A "…" is a blank the reviewer must
 * fill: the Studio refuses to send a text that still holds one (three mails
 * went out with the old QuickScan blanks).
 *
 * v1.2 (2026-10-07): the four answers that ask for a file send the melder to
 * a new melding instead of a reply (see VIA_NEW_REPORT).
 */
import type { DossierOutcome } from '@/services/fundermaps/interfaces/IDataops'

export interface CloseTemplate {
  value: string
  label: string
  /** The outcome this text usually goes with; shown as a hint, never forced. */
  outcome: DossierOutcome
  text: string
  /** Also offered in the message box, sent as an answer without closing. */
  asMessage?: boolean
}

/** A blank in a standard answer, to be filled before sending. */
export const BLANK = '…'

/**
 * Where a melder sends a missing file. Not "as a reply to this e-mail": the
 * inbound-mail webhook keeps only the text of a reply, so an attachment sent
 * that way never reaches the dossier (25 times since 2026-09-07). Point back
 * here once the API stores reply attachments.
 */
const VIA_NEW_REPORT =
  'via een nieuwe melding op https://melden.fundermaps.com en noem daarin uw meldcode'

const QS_PROCESSED =
  'Bedankt voor het toesturen van het Verkennend Funderingsonderzoek (QuickScan/Fase 0). Dit is opgenomen ' +
  'in de FunderMaps-database en wordt meegenomen in het funderingsrisico van uw pand. '

export const CLOSE_TEMPLATES: readonly CloseTemplate[] = [
  // Duplicaat, not Sluiten zonder rapportage: that one waits for every open
  // proposal, and a QuickScan we already hold has nothing to review (Don, 2026-09-25).
  {
    value: 'quickscan_processed_low',
    label: 'QuickScan verwerkt: risico laag',
    outcome: 'duplicate',
    text: QS_PROCESSED + 'Uw pand staat daarmee op risico laag.',
  },
  {
    value: 'quickscan_processed_medium',
    label: 'QuickScan verwerkt: risico midden',
    outcome: 'duplicate',
    text: QS_PROCESSED + 'Uw pand staat daarmee op risico midden.',
  },
  {
    value: 'quickscan_processed_high',
    label: 'QuickScan verwerkt: risico hoog',
    outcome: 'duplicate',
    text: QS_PROCESSED + 'Uw pand staat daarmee op risico hoog.',
  },
  {
    value: 'quickscan_not_recognised',
    label: 'Onderzoek door niet-erkend bureau',
    outcome: 'rejected',
    text:
      'Het meegestuurde onderzoek is niet uitgevoerd door een erkend bureau. Wij mogen het daarom niet gebruiken ' +
      'om de registratie aan te passen; uw rapport bewaren wij wel. Een onderzoek door een erkend bureau vraagt u aan via ' +
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
  // Explaining is not refusing (Don, 2026-10-08: "adviseer me dan ook niet om
  // op AFWIJZEN te klikken"): the melder reads "afgewezen" as having done
  // something wrong. Answers that explain our data or point elsewhere close as
  // Sluiten zonder rapportage; Afwijzen stays for a document we may not use.
  //
  // The usual way to close an "Iets anders" melding once the answer has gone
  // out through the message box (Don, 2026-10-08: "Vraag beantwoord en
  // dossier afgerond"). Preselected in the Studio when our answer is the last
  // word on the dossier.
  {
    value: 'question_answered',
    label: 'Vraag beantwoord, melding afgerond',
    outcome: 'accepted',
    text: 'Uw vraag is beantwoord en uw melding is afgerond.',
  },
  {
    value: 'general_question',
    label: 'Algemene vraag, geen melding over een pand',
    outcome: 'accepted',
    text:
      'Uw bericht is een algemene vraag. Dit loket is er voor meldingen over een specifiek pand, met een document waaruit de ' +
      'wijziging blijkt. Algemene vragen over funderingen kunt u stellen via https://funderconsult.com/feedback/form.',
  },
  {
    value: 'risk_deviates_subsidence',
    label: 'Risico wijkt af door zakkingssnelheid',
    outcome: 'accepted',
    asMessage: true,
    text:
      'Het funderingsrisico van dit pand wordt niet alleen door het funderingstype bepaald, maar ook door de zakking ' +
      'van het pand zelf, gemeten vanuit de satelliet. Dit pand zakt sneller dan gebruikelijk en valt daardoor in een ' +
      'hogere risicoklasse. Zonder funderingsonderzoek passen wij het risico daarom niet aan.',
  },
  {
    value: 'neighbour_differs',
    label: 'Buurwoning heeft een lager risico',
    outcome: 'accepted',
    asMessage: true,
    text:
      'Het risico van uw pand is berekend met de zakkingsmeting van uw eigen pand, gemeten vanuit de satelliet. ' +
      `Uw pand zakt met ${BLANK} mm per jaar; boven 1 mm per jaar valt een ondiepe fundering in een hogere klasse. ` +
      'Een buurwoning kan daardoor in een andere klasse vallen, ook in hetzelfde bouwblok. Een funderingsonderzoek ' +
      'of Verkennend Funderingsonderzoek aan uw pand gaat altijd voor de berekening.',
  },
  {
    value: 'how_class_is_set',
    label: 'Hoe is mijn risicoklasse bepaald',
    outcome: 'accepted',
    asMessage: true,
    text:
      'Bij elk risico staat hoe zeker het is. Vastgesteld: uit onderzoek aan dit pand. Afgeleid: van vergelijkbare, ' +
      'onderzochte panden in de directe omgeving. Indicatief: een schatting op basis van kenmerken als bouwjaar, ' +
      `ondergrond, grondwater en zakking. Voor uw pand is dit gebaseerd op ${BLANK}.`,
  },
  {
    value: 'data_correct',
    label: 'Onze gegevens kloppen',
    outcome: 'accepted',
    text:
      'Wij hebben uw melding beoordeeld. Voor dit pand gebruiken wij pandspecifieke gegevens over de fundering, de ondergrond ' +
      'en zakkingsmetingen. Die geven geen aanleiding om onze registratie aan te passen.',
  },
  {
    value: 'concrete_foundation',
    label: 'Nieuw pand of betonnen fundering',
    outcome: 'accepted',
    asMessage: true,
    text:
      `Volgens onze registratie heeft dit pand ${BLANK}. Heeft u een bouwtekening of bestek waaruit de betonnen ` +
      `fundering blijkt? Stuur die ${VIA_NEW_REPORT}, dan passen wij het funderingstype aan.`,
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
    value: 'research_incomplete',
    label: 'Onderzoek onvolledig',
    outcome: 'no_data',
    asMessage: true,
    text:
      `Het meegestuurde onderzoek is niet compleet: ${BLANK}. Stuur het volledige rapport ${VIA_NEW_REPORT}, ` +
      'dan beoordelen wij uw melding opnieuw.',
  },
  {
    value: 'attachment_missing',
    label: 'Bijlage ontbreekt',
    outcome: 'no_data',
    asMessage: true,
    text:
      `U noemt een document, maar er is geen bestand bij uw melding meegekomen. Stuur het ${VIA_NEW_REPORT}. ` +
      'Een downloadlink (zoals WeTransfer) verloopt na enkele dagen, daarom vragen wij om het bestand zelf.',
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
    value: 'risk_reassessed',
    label: 'Risico herbeoordeeld en aangepast',
    outcome: 'accepted',
    text: 'Wij hebben uw melding beoordeeld en het funderingsrisico aangepast. Vanaf morgen ziet u het nieuwe risico.',
  },
  {
    value: 'duplicate_melding',
    label: 'Dubbele melding',
    outcome: 'duplicate',
    text: `Deze melding gaat over hetzelfde als melding ${BLANK}. Die behandelen wij; u hoeft niets te doen.`,
  },
  {
    value: 'no_usable_data',
    label: 'Document gelezen, geen bruikbare gegevens',
    outcome: 'no_data',
    text:
      'Wij hebben het meegestuurde document bekeken, maar het bevat geen gegevens over de fundering die wij kunnen overnemen. ' +
      `Heeft u een funderingsonderzoek, een archieftekening of een herstelbewijs, stuur dat dan ${VIA_NEW_REPORT}.`,
  },
  {
    value: 'not_a_foundation_document',
    label: 'Geen funderingsdocument (advertentie, verkooprapport)',
    outcome: 'rejected',
    text:
      'Het meegestuurde document is geen funderingsdocument en zegt niets over de fundering van dit pand. ' +
      'Wij kunnen er daarom geen wijziging op baseren.',
  },
  {
    value: 'not_fundermaps',
    label: 'Gaat niet over FunderMaps',
    outcome: 'accepted',
    text:
      'Uw vraag gaat over een rapport of gegeven dat niet van FunderMaps komt. Neem daarvoor contact op met de ' +
      'opsteller van dat rapport.',
  },
]

export const CLOSE_TEMPLATE_OPTIONS = CLOSE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))

/** The answers that also fit the message box: sent as an answer, the dossier stays open. */
export const MESSAGE_TEMPLATES = CLOSE_TEMPLATES.filter((t) => t.asMessage)
export const MESSAGE_TEMPLATE_OPTIONS = MESSAGE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))

/** True when a text still holds a blank from a standard answer. */
export const hasBlank = (text: string) => text.includes(BLANK)

export const OUTCOME_HINT: Record<DossierOutcome, string> = {
  rejected: 'Afwijzen',
  no_data: 'Geen gegevens',
  accepted: 'Sluiten zonder rapportage',
  duplicate: 'Duplicaat',
}
