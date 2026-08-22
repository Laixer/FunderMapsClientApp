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
  receivedAt: string
  inquiryId: number | null
  /** Fields still needing a decision. */
  open: number
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
  /** Column name in report.inquiry_sample. */
  field: string
  value: string | null
  confidence: string | null
  evidence: string | null
  evidencePage: number | null
  /** pending · auto_accepted · confirmed · corrected · rejected · superseded */
  state: string
  model: string
  promptVersion: string
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
}

export type VerdictOutcome = 'confirmed' | 'corrected' | 'rejected'

export interface IVerdict {
  fieldId: number
  outcome: VerdictOutcome
  /** Required when correcting: the value the reviewer put instead. This is the label. */
  finalValue?: string | null
  /** Why. On a rejection this is the most useful thing we collect. */
  note?: string | null
  reviewSeconds?: number | null
}
