/**
 * The review lane: what the pipeline proposes and what a reviewer decides.
 *
 * Mirrors `FunderMapsApi/src/routes/dataops.ts`. Every value here is a
 * proposal -- nothing has touched `report.*` until a reviewer commits it.
 */

/** One submission waiting for a person. */
export interface IReviewQueueItem {
  id: number
  channel: string
  subject: string | null
  externalRef: string | null
  /** Melder-facing code (`FM2026-000042`); null on bulk drops. */
  reference: string | null
  /** `NL.IMBAG.PAND.*` the submission was filed under; null when unresolved. */
  buildingId: string | null
  /** geocoder.building.built_year (YYYY-MM-DD) of the dossier's pand, or null. The date estimate for archive drawings (#338). */
  buildingBuiltYear?: string | null
  receivedAt: string
  inquiryId: number | null
  /** The rapportage this dossier re-reads (channel audit); null on intake dossiers. */
  auditInquiryId: number | null
  /**
   * Fields still needing a decision. Zero is a real state, not an empty
   * queue: the pipeline read nothing off the document and a person has to
   * look at it anyway.
   */
  open: number
  /** Documents on the dossier. */
  files: number
  /** Whether the pipeline has read it at all. False = ingest not run yet. */
  read: boolean
  /** What kind of document the pipeline read this to be (`report.inquiry_type` code); null until read. */
  kind: string | null
  /** accepted · rejected · duplicate · no_data; null while on the desk. */
  outcome: string | null
  outcomeAt: string | null
  /** The reviewer's reason. Required on rejected and duplicate, so rarely empty there. */
  outcomeNote: string | null
  duplicateOf: number | null
}

/** What one page of a document turned out to be. Decides whether it was read at all. */
export interface IArtifactPage {
  artifactId: number
  pageNo: number
  /** drawing · archive_document · report · photo · map · blank · other */
  material: string | null
  materialConf: string | null
  isClean: boolean
  redactedBoxes: number
  textChars: number | null
}

export interface IReviewArtifact {
  id: number
  dossierId: number
  storageKey: string
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
  pageCount: number | null
  /** vision · text · none */
  lane: string
  /**
   * The label the melder put on the file (files[].category: foundationresearch,
   * archieveresearch, quickscan, herstelbewijs, foto, overig). The commit derives
   * the inquiry type from it when the reviewer picks none; null on older rows.
   */
  declaredCategory: string | null
  /**
   * What the preparer wrote on top of the document. Never shown to a model;
   * shown to a reviewer, because on an older document it IS the answer someone
   * already gave.
   */
  annotationText: string | null
  annotationPages: number[] | null
  /** Signed, expires in hours. Minted by the API; never a raw storage URL. */
  accessLink: string
  pages: IArtifactPage[]
}

/**
 * One proposed value.
 *
 * `evidence` is the passage it was read from, and carries two prefixes worth
 * showing plainly: `afgeleid:` when the model reasoned rather than read, and a
 * Dutch refusal when the document was not allowed to establish the field --
 * a QuickScan stating a funderingstype it took from FunderMaps.
 */
export interface IProposedField {
  id: number
  artifactId: number
  /** Column name in report.inquiry_sample (English), or `recovery_note`. */
  field: string
  value: string | null
  confidence: string | null
  evidence: string | null
  evidencePage: number | null
  /** pending · auto_accepted (legacy, treat as pending) · confirmed · corrected · rejected · superseded */
  /** pending · agreed · confirmed · corrected · rejected · superseded · auto_accepted */
  state: string
  /** On an audit: what the database held for this field when the document was read. Null = nothing. */
  currentValue?: string | null
  /** Per-address value: the address as the report wrote it; null = about the document as a whole. */
  addressText: string | null
  /** geocoder.address id it resolved to; null when it did not (the text is still shown). */
  addressId: string | null
  model: string
  promptVersion: string
}

/** One line of the dossier's append-only timeline (§11.1). */
export interface IDossierEntry {
  id: number
  at: string
  /** received · extraction · finding · verdict · remark · question · reply · status */
  kind: string
  /** melder · reviewer · pipeline · model · system */
  actorKind: string
  actor: string | null
  /** The human-readable line, Dutch. */
  text: string
  /** Structured detail; a sent mail carries body.mail { kind, to, subject, text } (#350). */
  body?: Record<string, unknown> | null
  visibleToMelder: boolean
}

/**
 * One address of a dossier, and what was decided about it (#333 part C).
 *
 * Three origins in one list: the pand the submission was filed under (`own`),
 * the addresses the pipeline read off the document, and the ones a reviewer
 * added by hand. `rejected` means "not part of this dossier" (Don's ruling),
 * not "its values are wrong": the open values under it are superseded and it
 * never becomes a sample. An address the Worker could not resolve has no id
 * and no label; it can be re-linked or rejected, not confirmed.
 */
export interface IDossierAddress {
  /** What the values are grouped by: the address id, or `text:<address_text>` when unresolved. */
  key: string
  /** Internal gfm- id, as stored on the dossier today; echo it, never mint one. */
  addressId: string | null
  /** BAG nummeraanduiding of `addressId`; the id to prefer when sending an address. Absent from older API builds. */
  addressExternalId?: string | null
  buildingId: string | null
  /** "Molenwal 15, 3421 CK Oudewater"; null when unresolved. */
  label: string | null
  /** The address as the document wrote it. */
  addressText: string | null
  /** pipeline · reviewer · melder */
  source: 'pipeline' | 'reviewer' | 'melder'
  /** pending · confirmed · rejected */
  state: 'pending' | 'confirmed' | 'rejected'
  /** The pand the dossier was filed under. Shown first; changed with `setBuilding`, never rejected. */
  own: boolean
  /** Values under it still waiting for a verdict. */
  open: number
  /** Values under it that are not superseded. */
  total: number
  note: string | null
  decidedAt: string | null
}

export type AddressVerdictOutcome = 'confirmed' | 'rejected' | 'pending'

export interface IReviewDossier {
  dossier: {
    id: number
    channel: string
    subject: string | null
    externalRef: string | null
    duplicateOf: number | null
    inquiryId: number | null
    /** The rapportage this dossier re-reads (channel audit); null on intake dossiers. */
    auditInquiryId: number | null
  /** geocoder.building.built_year (YYYY-MM-DD) of the dossier's pand, or null. The date estimate for archive drawings (#338). */
  buildingBuiltYear?: string | null
    receivedAt: string
    outcome: string | null
    outcomeAt?: string | null
    outcomeNote?: string | null
    /** Who sent it in. Bulk drops carry none — then a question cannot be mailed. */
    submitter: {
      name?: string | null
      email?: string | null
      phone?: string | null
      company?: string | null
      /** resident · owner · broker · … as the form asked it. */
      type?: string | null
      isOwner?: boolean | null
    } | null
    /**
     * What the form recorded (#350): topic, the answers per topic, the
     * melder's own toelichting. Loket imports carry their own keys here.
     */
    payload?: {
      topic?: string | null
      topicLabel?: string | null
      answers?: Record<string, unknown> | null
      note?: string | null
      source?: string | null
      [key: string]: unknown
    } | null
  }
  artifacts: IReviewArtifact[]
  fields: IProposedField[]
  entries: IDossierEntry[]
  /** The addresses this dossier is about, own pand first (#333 part C). */
  addresses: IDossierAddress[]
}

export type VerdictOutcome = 'confirmed' | 'corrected' | 'rejected'

/**
 * accepted · rejected · duplicate · no_data. `no_data` is "we looked, nothing
 * to take" -- a logo, a street photo, a maintenance plan -- and is the one a
 * reviewer reaches for most on a bulk drop.
 */
export type DossierOutcome = 'accepted' | 'rejected' | 'duplicate' | 'no_data'

/** Closing a whole dossier. `note` is required for rejected and duplicate. */
export interface IDossierOutcome {
  outcome: DossierOutcome
  note?: string | null
}

export interface IVerdict {
  /** One field; or use `fieldIds` for a range decided in one click (API #199, Worker #186). */
  fieldId?: number
  fieldIds?: number[]
  outcome: VerdictOutcome
  /** Required when correcting: the value the reviewer put instead. This is the label. */
  finalValue?: string | null
  /** Why. On a rejection this is the most useful thing we collect. */
  note?: string | null
  reviewSeconds?: number | null
}
