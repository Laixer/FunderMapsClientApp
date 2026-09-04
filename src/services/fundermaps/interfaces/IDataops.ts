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
  receivedAt: string
  inquiryId: number | null
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
  state: string
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
  visibleToMelder: boolean
}

export interface IReviewDossier {
  dossier: {
    id: number
    channel: string
    subject: string | null
    externalRef: string | null
    duplicateOf: number | null
    inquiryId: number | null
    receivedAt: string
  }
  artifacts: IReviewArtifact[]
  fields: IProposedField[]
  entries: IDossierEntry[]
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
  fieldId: number
  outcome: VerdictOutcome
  /** Required when correcting: the value the reviewer put instead. This is the label. */
  finalValue?: string | null
  /** Why. On a rejection this is the most useful thing we collect. */
  note?: string | null
  reviewSeconds?: number | null
}
