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
  /** Who holds the dossier (API #222); absent from older API builds, null in the general queue. */
  assignedTo?: string | null
  assignedAt?: string | null
  assignedName?: string | null
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
  /** BAG nummeraanduiding, the only address id there is (Worker #158); echo it, never mint one. */
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
    /** Melder-facing code (`FM2026-000042`); null on bulk drops. Absent from older API builds. */
    reference?: string | null
    duplicateOf: number | null
    inquiryId: number | null
    /** The rapportage this dossier re-reads (channel audit); null on intake dossiers. */
    auditInquiryId: number | null
    /** The herstel recorded from this dossier (#341); independent of inquiryId. Absent from older API builds. */
    recoveryId?: number | null
    /** Who holds the dossier (API #222); absent from older API builds, null in the general queue. */
    assignedTo?: string | null
    assignedAt?: string | null
    assignedName?: string | null
  /** geocoder.building.built_year (YYYY-MM-DD) of the dossier's pand, or null. The date estimate for archive drawings (#338). */
  buildingBuiltYear?: string | null
    /** The model row of the dossier's pand now (API #215); absent from older API builds, null without a pand or row. */
    buildingModel?: {
      foundationType: string | null
      foundationTypeReliability: string | null
      drystandRisk: string | null
      dewateringDepthRisk: string | null
      bioInfectionRisk: string | null
      unclassifiedRisk: string | null
    } | null
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
  /** Rapportages already on the dossier's pand (API #231); absent from older API builds. */
  existingRapportages?: IExistingRapportage[]
}

/**
 * A rapportage that already has a sample on the dossier's pand, for the
 * warning before "Overnemen als rapportage" (Don, 2026-10-08).
 */
export interface IExistingRapportage {
  id: number
  /** Inquiry type code, e.g. foundation_research. */
  type: string
  documentDate: string | null
  documentName: string | null
  auditStatus: string
  addresses: number
  samples: number
  /** Its stored file has the byte size of one of this dossier's documents. */
  sameFile: boolean
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

/**
 * Where a dossier stands on the Datastroom page (API GET /dataops/flow). One
 * per dossier, so a channel's buckets add up to everything it brought in.
 * Closed: `rapportage` (in FunderMaps) and the four outcomes; open: no file,
 * not read yet, nothing found, values to judge, all judged.
 */
export type FlowBucket =
  | 'rapportage'
  | 'accepted'
  | 'no_data'
  | 'rejected'
  | 'duplicate'
  | 'question'
  | 'unread'
  | 'empty'
  | 'proposals'
  | 'judged'

export interface IDataopsFlow {
  generatedAt: string
  flow: { channel: string; bucket: FlowBucket; count: number }[]
  /** Mondays, oldest first: the last 12 weeks. */
  weeks: string[]
  /** Every week for every channel, zero included. */
  weekly: { week: string; channel: string; received: number; closed: number }[]
  /**
   * How long the open dossiers have waited, per channel: five age bands (< 7
   * days, 7–14, 14–30, 30–90, 90+) and the median in days. Absent from older API builds.
   */
  waiting?: {
    channel: string
    open: number
    week: number
    twoWeeks: number
    month: number
    quarter: number
    older: number
    medianDays: number | null
  }[]
}

/** How often a reviewer took over, corrected or rejected what the document reader proposed. */
export interface IReaderTally {
  judged: number
  confirmed: number
  corrected: number
  rejected: number
}

/** The reader's track record (API GET /dataops/reader-quality): overall, per field, per reader version. */
export interface IReaderQuality {
  generatedAt: string
  total: IReaderTally
  /** Most judged first. `field` is the lane's key (`foundation_type`). */
  fields: (IReaderTally & { field: string })[]
  /** In the order the versions came (dataops-2026.1, dataops-2026.2, ...). */
  versions: (IReaderTally & { model: string; promptVersion: string })[]
}

/** Where a rapportage came from (API GET /dataops/rapportage/:id/origin). Empty lists: typed in by hand. */
export interface IRapportageOrigin {
  dossiers: {
    id: number
    reference: string | null
    channel: string
    subject: string | null
    receivedAt: string
    outcomeAt: string | null
    documents: { id: number; name: string | null; pages: number }[]
    found: number
    judged: number
    /** Names of the staff who judged its values, first seen first. */
    judgedBy: string[]
    /** The take-over that made this rapportage; `by` is null for a backfilled one. */
    committed: { at: string; by: string | null } | null
    /** The risk recalculation(s) after it: per address what moved, or nothing moved; null when not recalculated. */
    risk: {
      changed: { address: string | null; fields: { label: string; before: string | null; after: string | null }[] }[]
      unchanged: boolean
    } | null
  }[]
  /** Nalezingen that read this rapportage again, newest first. */
  audits: { id: number; receivedAt: string; outcome: string | null; outcomeAt: string | null; open: number; judged: number }[]
}

export type RunState = 'ok' | 'failed' | 'missing' | 'upcoming'
export interface IRiskClasses {
  a: number
  b: number
  c: number
  d: number
  e: number
  none: number
}

/** The model's runs and the spread of its labels (API GET /dataops/models). */
export interface IModels {
  /** Newest day first; the two refreshes a day (12:30 and 21:00, Amsterdam). */
  grid: {
    day: string
    midday: { status: RunState; finishedAt: string | null }
    evening: { status: RunState; finishedAt: string | null }
  }[]
  /** The last export per tileset. `bytes` may come as a string (bigint). */
  exports: { tileset: string; seconds: number; bytes: number | string; features: number; finishedAt: string }[]
  /** The served (default) model, counted after its last refresh. */
  spread: {
    refreshedAt: string | null
    computedAt: string
    total: number
    foundationType: { type: string | null; n: number }[]
    risks: Record<'drystand' | 'dewatering_depth' | 'bio_infection' | 'unclassified', IRiskClasses>
  }
}

/** Where the dossiers come from (API GET /dataops/map): per municipality, by CBS code. */
export interface IDataopsMap {
  generatedAt: string
  municipalities: { code: string; name: string; dossiers: number; done: number; open: number; lat: number; lon: number }[]
  /** Dossiers without a pand: they cannot be placed. */
  unplaced: number
  total: number
}

/** One pand's whole story (API GET /dataops/building/:id): the pand, the model now, and what happened to it. */
export interface IBuildingStory {
  /** The BAG pand id the request resolved to (a nummeraanduiding id resolves to its pand). */
  id: string
  building: {
    id: string
    builtYear: number | null
    buildingType: string | null
    active: boolean
    lat: number
    lon: number
    /** GeoJSON (Multi)Polygon of the pand. */
    outline: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown } | null
    neighborhood: string | null
    district: string | null
    municipality: string | null
    municipalityCode: string | null
  } | null
  addresses: { id: string; street: string; number: string; postalCode: string; city: string }[]
  /** All addresses of the pand; `addresses` holds the first 50. */
  addressCount: number
  /** What the model says now (data.model_risk_static); codes, labelled in the Studio. */
  model: {
    foundationType: string | null
    foundationTypeReliability: string | null
    constructionYear: number | null
    constructionYearReliability: string | null
    drystandRisk: string | null
    drystandRiskReliability: string | null
    dewateringDepthRisk: string | null
    dewateringDepthRiskReliability: string | null
    bioInfectionRisk: string | null
    bioInfectionRiskReliability: string | null
    unclassifiedRisk: string | null
    /** The rapportage the model's label rests on, when it rests on one. */
    inquiryId: number | null
    inquiryType: string | null
    recoveryType: string | null
    overallQuality: string | null
    damageCause: string | null
    enforcementTerm: number | null
    restorationCosts: number | null
    velocity: number | null
    groundWaterLevel: number | null
    groundLevel: number | null
    height: number | null
    surfaceArea: number | null
    soil: string | null
  } | null
  rapportages: {
    id: number
    type: string
    documentName: string | null
    documentDate: string | null
    auditStatus: string
    createdAt: string
    contractor: string | null
    samples: number
    addresses: string[]
    foundationType: string | null
    overallQuality: string | null
    damageCause: string | null
    enforcementTerm: string | null
    recoveryAdvised: boolean
  }[]
  recoveries: {
    id: number
    documentType: string
    documentName: string | null
    documentDate: string | null
    auditStatus: string
    createdAt: string
    status: string | null
    recoveryType: string | null
    pileType: string | null
    recoveryDate: string | null
    contractor: string | null
  }[]
  /** Meldingen from before the dossiers (report.incident). */
  incidents: { id: string; createdAt: string; questionType: string | null; auditStatus: string | null; damageCause: string | null }[]
  dossiers: {
    id: number
    reference: string | null
    channel: string
    subject: string | null
    receivedAt: string
    outcome: string | null
    outcomeAt: string | null
    inquiryId: number | null
    recoveryId: number | null
    auditInquiryId: number | null
    duplicateOf: number | null
  }[]
  /** Model recalculations that moved this pand, newest first; letters as on the map. */
  modelChanges: { at: string; dossierId: number; address: string | null; fields: { label: string; before: string | null; after: string | null }[] }[]
}

/** The Studio's day (API GET /dataops/today): what the machines and the people did today, and what waits. */
export interface IStudioToday {
  generatedAt: string
  /** The Amsterdam day, YYYY-MM-DD. */
  day: string
  today: {
    received: { total: number; byChannel: { channel: string; n: number }[] }
    reader: {
      documents: number
      pages: number
      errors: number
      costUsd: number
      proposed: number
      models: string[]
      lastAt: string | null
    } | null
    judged: {
      total: number
      byOutcome: Record<string, number>
      medianSeconds: number | null
      people: number
      mine: number
    }
    committed: number
    closed: number
    modelRuns: { job: string; status: string; finishedAt: string }[]
  }
  waiting: { toRead: number; toJudge: number; openDossiers: number } | null
  /** The last fourteen days, oldest first; `series` runs along them. */
  days: string[]
  series: Record<'received' | 'read' | 'judged' | 'committed' | 'closed', number[]>
}

/** The panden with open work (API GET /dataops/buildings): the first 50, newest first, and how many there are. */
export interface IPandenOpen {
  generatedAt: string
  total: number
  open: {
    /** The BAG pand id. */
    id: string
    open: number
    dossiers: number
    lastReceived: string
    street: string | null
    number: string | null
    city: string | null
    municipality: string | null
  }[]
}
