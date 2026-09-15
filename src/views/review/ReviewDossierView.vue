<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import Combobox from '@/components/Common/Combobox.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import DossierAddresses from '@/components/Review/DossierAddresses.vue'
import api from '@/services/fundermaps'
import type {
  IReviewDossier,
  IProposedField,
  IDossierAddress,
  VerdictOutcome,
  DossierOutcome,
} from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { isPreviewableImageMime } from '@/services/documentFile'
import { parseQuery, toQueueOpts } from '@/services/reviewExplorer'
import {
  CHANNEL_LABEL,
  FIELD_LABEL,
  FIELD_UNIT,
  FOUNDATION_TYPE_CODE_OPTIONS,
  INQUIRY_TYPE_CODE_OPTIONS,
  OUTCOME_LABEL,
  VERDICT_LABEL,
  derivedInquiryType,
  displayValue as labelValue,
  formatDate,
} from '@/services/reviewLabels'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { SelectOption } from '@/services/options'
import { useStudioStore } from '@/stores/studio'
import { toastInfo, toastSuccess } from '@/services/toast'

/**
 * Judging one submission.
 *
 * A proposed value cannot be judged on its own, so three things sit together:
 * what the pipeline read, the passage it read it from, and the document itself.
 * If the citation matches the page, the answer is sound — which is exactly how
 * Don worked through 83 of these by hand, and how every real fault in the
 * pipeline has been found so far.
 *
 * Decisions are per value. A document routinely yields six where five are solid
 * and one is a stretch; one verdict for the whole thing would either discard
 * the good ones or wave the bad one through.
 */
const route = useRoute()
const router = useRouter()
const studio = useStudioStore()

const data = ref<IReviewDossier | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref<number | null>(null)
const decided = ref<Record<number, VerdictOutcome>>({})
const notes = ref<Record<number, string>>({})
const corrections = ref<Record<number, string>>({})
/** Which document is on screen. A dossier can carry several. */
const shown = ref(0)
/**
 * Per-proposal drawers. A value is confirmed or refused far more often than
 * it is edited, so the correction input and the toelichting live behind
 * "Aanpassen…" rather than under every row: the Fugro report of 2026-09-01
 * carried 73 proposals, and 73 empty textareas is a scroll, not a screen.
 */
const editing = ref<Record<number, boolean>>({})
/** Citations are clamped to two lines; a click shows the whole passage. */
const unclamped = ref<Record<number, boolean>>({})
/** Address groups folded away by the reviewer, keyed by address (id, or text when unresolved). */
const collapsed = ref<Record<string, boolean>>({})

/** Closing the dossier as a whole: the note, and whether the request is out. */
const closeNote = ref('')
const closing = ref(false)
const closed = ref<DossierOutcome | null>(null)
/** The rapportage a commit made, for a link that outlives the toast (Don #321 §6). */
const committedInquiryId = ref<number | null>(null)

/**
 * Load the dossier in the URL. A function rather than a one-off in
 * onBeforeMount because closing a dossier navigates straight to the next
 * one, and vue-router reuses this component for /review/:id → /review/:id —
 * so every piece of per-dossier state is reset here, explicitly.
 */
let openedAt = Date.now()
async function load() {
  loading.value = true
  error.value = null
  data.value = null
  busy.value = null
  decided.value = {}
  notes.value = {}
  corrections.value = {}
  shown.value = 0
  editing.value = {}
  unclamped.value = {}
  collapsed.value = {}
  closeNote.value = ''
  closed.value = null
  committedInquiryId.value = null
  openedAt = Date.now()
  try {
    data.value = await api.dataops.dossier(Number(route.params.id))
    // A decision already on the server is a decision. Until 2026-09-08 only
    // in-session verdicts counted, so a reload put every judged value back
    // in the open list while the queue said zero.
    const seeded: Record<number, VerdictOutcome> = {}
    for (const f of data.value.fields) {
      if (f.state === 'confirmed' || f.state === 'corrected' || f.state === 'rejected') seeded[f.id] = f.state
    }
    decided.value = seeded
  } catch (e) {
    error.value = describeFailure(e, 'Dit dossier kon niet worden geladen.')
  } finally {
    loading.value = false
  }
}

/**
 * Re-fetch the values and the timeline without resetting what the reviewer
 * is doing. An address action can put values aside, bring them back or move
 * them (#333 C); the rows on screen have to follow, the half-typed
 * correction two rows down does not have to go.
 */
async function refreshFields() {
  if (!data.value) return
  try {
    const fresh = await api.dataops.dossier(data.value.dossier.id)
    data.value = { ...data.value, fields: fresh.fields, entries: fresh.entries, addresses: fresh.addresses }
    const seeded: Record<number, VerdictOutcome> = { ...decided.value }
    for (const f of fresh.fields) {
      if (f.state === 'confirmed' || f.state === 'corrected' || f.state === 'rejected') seeded[f.id] = f.state
      else if (f.state === 'pending' || f.state === 'superseded') delete seeded[f.id]
    }
    decided.value = seeded
  } catch (e) {
    error.value = describeFailure(e, 'De voorstellen konden niet worden ververst.')
  }
}

/* ------------------------------------------------------------ addresses */

/** The addresses this dossier is about, own pand first (#333, points 3 and 4). */
const addresses = computed<IDossierAddress[]>(() => data.value?.addresses ?? [])
const addressByKey = computed(() => new Map(addresses.value.map((a) => [a.key, a])))
/** The address a value sits under, as the panel knows it. */
const addressOf = (f: IProposedField) =>
  addressByKey.value.get(f.addressId ?? (f.addressText ? `text:${f.addressText}` : '')) ?? null
/** "· Molenwal 15, 3421 CK Oudewater" for a value with an address, else the text the document wrote. */
const addressLine = (f: IProposedField): string | null => addressOf(f)?.label ?? f.addressText ?? null
/** Addresses a value can be moved to: resolved and not put aside. */
const moveTargets = computed(() =>
  addresses.value.filter((a) => a.addressId && a.state !== 'rejected').map((a) => ({ value: a.addressId!, label: a.label ?? a.addressId! })),
)
function onAddresses(list: IDossierAddress[], fieldsChanged: boolean) {
  if (data.value) data.value = { ...data.value, addresses: list }
  if (fieldsChanged) void refreshFields()
}
/** Move one value to another of the dossier's addresses, from the drawer. */
async function moveField(f: IProposedField, addressId: string) {
  if (!data.value || !addressId || addressId === f.addressId) return
  busy.value = f.id
  try {
    const r = await api.dataops.addressRelink(data.value.dossier.id, { to: addressId, fieldIds: [f.id] })
    data.value = { ...data.value, addresses: r.addresses }
    await refreshFields()
  } catch (e) {
    error.value = describeFailure(e, 'De waarde kon niet naar dat adres worden verplaatst.')
  } finally {
    busy.value = null
  }
}

/** A nalezing: this dossier re-reads a rapportage that is already in the database. */
const isAudit = computed(() => !!data.value?.dossier.auditInquiryId)
/** Values the reading agreed with the database on -- settled by the pipeline, never open. */
const agreed = computed(() => (data.value?.fields ?? []).filter((f) => f.state === 'agreed'))
/** Not compared or replaced by a later reading: not this screen's business. */
const isSettledByPipeline = (f: IProposedField) => f.state === 'agreed' || f.state === 'superseded'


onBeforeMount(load)
watch(
  () => route.params.id,
  (id, prev) => {
    if (id !== prev && route.name === 'review-dossier') load()
  },
)

/** A proposed value as a person reads it: Dutch for enum codes, a real date for dates. */
const displayValue = (f: IProposedField) => labelValue(f.field, f.value)

/* The label tables used to live here; they are in services/reviewLabels.ts now
   so the "Beoordeeld" panel and the header read the same Dutch as the cards. */

/**
 * The bureaus, for the `contractor` field. The pipeline reads the name as
 * printed on the cover; the commit matches it against this list, and this
 * select lets the reviewer pick the row when the match is wrong or missing.
 * Loaded once, only when a dossier actually proposes a contractor.
 */
const contractors = ref<IContractor[]>([])
const contractorOptions = computed<SelectOption[]>(() =>
  contractors.value.map((c) => ({ value: String(c.id), label: c.name })),
)
/** Same normalisation as the API's contractor-match, so the preselect shows what the commit will do. */
const normaliseName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' en ')
    .replace(/\b(b\.?\s?v\.?|n\.?\s?v\.?|v\.?o\.?f\.?|c\.?v\.?|bv|nv|vof|holding|groep|group)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
function guessContractor(printed: string): IContractor | null {
  const p = normaliseName(printed)
  if (p.length < 2) return null
  const rows = contractors.value.map((c) => ({ c, n: normaliseName(c.name) })).filter((r) => r.n)
  const exact = rows.find((r) => r.n === p)
  if (exact) return exact.c
  const prefix = (long: string, short: string) =>
    short.length >= 4 && (long === short || long.startsWith(`${short} `))
  return (
    rows
      .filter((r) => prefix(p, r.n) || prefix(r.n, p))
      .sort((a, b) => b.n.length - a.n.length)[0]?.c ?? null
  )
}
/** The row the commit will pick for a proposed bureau name, or null when it will fall back to FunderMaps B.V. */
const contractorGuess = (f: IProposedField) =>
  f.field === 'contractor' && f.value ? guessContractor(f.value) : null

watch(
  // Any dossier that can be committed shows the Uitvoerder control; a
  // nalezing does not, and a dossier that proposed no bureau still needs
  // the list for the reviewer to type one.
  () => !!data.value && !data.value.dossier.auditInquiryId,
  async (needed) => {
    if (!needed || contractors.value.length) return
    try {
      contractors.value = await api.contractor.list()
    } catch {
      /* the select stays empty; the reviewer can still confirm or reject the printed name */
    }
  },
  { immediate: true },
)

const open = computed(() =>
  (data.value?.fields ?? []).filter((f) => !decided.value[f.id] && !isSettledByPipeline(f)),
)

/**
 * Open values grouped by address. A funderingsonderzoek covers a block; the
 * report's own tables are per address, and so is report.inquiry_sample. The
 * document-level group ("het rapport") comes first, then each address in the
 * order the API returns them. Grouped by the resolved address (two spellings
 * of one house are one group; a value moved to 59A shows under 59A), by the
 * text when the Worker could not resolve it.
 */
const openByAddress = computed(() => {
  const groups = new Map<string, IProposedField[]>()
  for (const f of open.value) {
    const key = f.addressId ?? f.addressText ?? ''
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0))
    .map(([key, fields]) => {
      const a = addressOf(fields[0]!)
      return {
        key,
        /** The group title: the resolved address, else what the document wrote. */
        address: key === '' ? '' : (a?.label ?? fields[0]!.addressText ?? key),
        resolved: fields.some((f) => f.addressId),
        state: a?.state ?? null,
        own: a?.own ?? false,
        fields,
      }
    })
})
const settled = computed(() => (data.value?.fields ?? []).filter((f) => decided.value[f.id]))
/** How a proposal relates to the database, for the row (nalezing only). */
function currentLabel(f: IProposedField): { text: string; tone: 'amber' | 'red' } | null {
  if (!isAudit.value || f.state === 'agreed') return null
  if (f.currentValue == null) return { text: 'niet in de database', tone: 'amber' }
  return { text: `in de database: ${labelValue(f.field, f.currentValue)}`, tone: 'red' }
}

/** Whether the pipeline has read this dossier at all. */
const wasRead = computed(() => (data.value?.artifacts ?? []).some((a) => a.pages.length > 0))
/**
 * Read, and found nothing. The most common shape on the wood corpus (55% of
 * documents are photographs) and the one this screen exists for: a person
 * looks at the document and either throws the dossier out or enters it by hand.
 */
const nothingProposed = computed(
  () => !loading.value && !!data.value && data.value.fields.filter((f) => !isSettledByPipeline(f)).length === 0 && agreed.value.length === 0,
)
/** The model was sure and quoted a passage. Still a proposal — nothing is accepted for you. */
const isSure = (f: IProposedField) =>
  Number(f.confidence ?? 0) >= 0.95 && !!f.evidence?.trim() && !isInferred(f)

/** The model reasoned rather than read. Said plainly, not hidden. */
const isInferred = (f: IProposedField) => /^\s*afgeleid\s*:/i.test(f.evidence ?? '')

/**
 * Close the dossier. `rejected` is the cat picture, the empty scan, the
 * report filed under the wrong address; `duplicate` the same thing twice.
 * Both need a word on why — that note is the most useful thing collected here.
 */
const NOTE_REQUIRED: ReadonlySet<DossierOutcome> = new Set(['rejected', 'duplicate'])
/**
 * Set when Afwijzen or Duplicaat was clicked without a reason. The buttons stay
 * clickable -- a greyed-out button does not say what it wants -- and the note
 * field says it instead (#333, point 10).
 */
const noteMissingFor = ref<DossierOutcome | null>(null)
const noteError = computed(() =>
  noteMissingFor.value && !closeNote.value.trim()
    ? `Geef eerst een reden: waarom wordt dit dossier ${noteMissingFor.value === 'duplicate' ? 'als duplicaat gesloten' : 'afgewezen'}?`
    : null,
)
watch(closeNote, (v) => {
  if (v.trim()) noteMissingFor.value = null
})

async function closeDossier(outcome: DossierOutcome) {
  if (!data.value) return
  if (NOTE_REQUIRED.has(outcome) && !closeNote.value.trim()) {
    noteMissingFor.value = outcome
    document.querySelector<HTMLTextAreaElement>('#review-close-note textarea')?.focus()
    return
  }
  closing.value = true
  try {
    await api.dataops.close(data.value.dossier.id, {
      outcome,
      note: closeNote.value.trim() || null,
    })
    closed.value = outcome
    void studio.refreshCounts(null)
    await openNext(data.value.dossier.id, outcome)
  } catch (e) {
    error.value = describeFailure(e, 'Het dossier kon niet worden gesloten.')
  } finally {
    closing.value = false
  }
}

/** Values a person has taken over: what the commit will write. */
const taken = computed(() => settled.value.filter((f) => decided.value[f.id] === 'confirmed' || decided.value[f.id] === 'corrected'))
const committing = ref(false)

/**
 * The value the commit will use for a document-level field: the correction if
 * there was one, else the confirmed reading, else nothing (and the API falls
 * back). Shown before the button so "datum = de dag van uploaden" is a thing
 * the reviewer sees rather than discovers in the inquiry list a week later.
 */
function takenDocumentValue(field: string): string | null {
  const f = taken.value.find((t) => t.field === field)
  if (!f) return null
  return decided.value[f.id] === 'corrected' ? (corrections.value[f.id] ?? null) : f.value
}
/** The bureau row a taken-over contractor value points at, or null when the commit would fall back. */
function contractorRowFor(raw: string | null): IContractor | null {
  if (!raw) return null
  return /^\d+$/.test(raw)
    ? (contractors.value.find((c) => String(c.id) === raw) ?? null)
    : guessContractor(raw)
}

/**
 * What the commit writes on the inquiry itself, as three controls rather than
 * a read-only preview. They start out as whatever was taken over from the
 * document and are sent with the commit, so a value a reviewer took over is
 * what lands -- never a fallback that quietly replaced it -- and a value the
 * pipeline missed can be typed here without a detour past the rapportage
 * (#333, point 8).
 */
const commitType = ref<string | null>(null)
/**
 * What Soort becomes when the reviewer leaves it empty, spelled out: the
 * melder's label mapped the way the commit maps it, on the document the commit
 * will pick (the first dataops/ or intake/ artifact). Don, #338 point 1.
 */
const derivedTypeHint = computed(() => {
  const doc =
    data.value?.artifacts.find((a) => a.storageKey.startsWith('dataops/') || a.storageKey.startsWith('intake/')) ??
    data.value?.artifacts[0]
  const d = derivedInquiryType(doc?.declaredCategory, doc?.lane)
  return `Niet overgenomen: wordt ${labelValue('inquiry_type', d.code)} (${d.from})`
})
const commitDate = ref<string | null>(null)
/** Contractor id as a string: the option values are strings, so the combobox can match them. */
const commitContractor = ref<string | null>(null)
/** The printed bureau name when it matched no row: shown, and kept in the note by the API. */
const contractorUnmatched = computed(() => {
  const raw = takenDocumentValue('contractor')
  return raw && !/^\d+$/.test(raw) && !guessContractor(raw) ? raw : null
})
watch(
  [taken, contractors],
  () => {
    if (!commitType.value) commitType.value = takenDocumentValue('inquiry_type')
    if (!commitDate.value) {
      const d = takenDocumentValue('document_date')
      commitDate.value = d && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null
    }
    if (!commitContractor.value) {
      const row = contractorRowFor(takenDocumentValue('contractor'))
      commitContractor.value = row ? String(row.id) : null
    }
  },
  { immediate: true, deep: true },
)
/** The soort the commit will use: what the reviewer chose, else what the label derives. */
const effectiveCommitType = computed(() => {
  if (commitType.value) return commitType.value
  const doc =
    data.value?.artifacts.find((a) => a.storageKey.startsWith('dataops/') || a.storageKey.startsWith('intake/')) ??
    data.value?.artifacts[0]
  return derivedInquiryType(doc?.declaredCategory, doc?.lane).code
})
const ARCHIVE_TYPES = new Set(['archive_research', 'architectural_research'])
/**
 * What Datum rapport becomes when the reviewer leaves it empty (#338, Don
 * 2026-09-14): never the day the melding arrived. An archive drawing takes the
 * pand's construction year as an estimate; anything else has no fallback and
 * the commit refuses until a date is typed.
 */
const builtYearEstimate = computed(() => {
  const y = data.value?.dossier.buildingBuiltYear?.slice(0, 4)
  return ARCHIVE_TYPES.has(effectiveCommitType.value) && y && /^\d{4}$/.test(y) && y !== '0000' ? `${y}-01-01` : null
})
const commitDateHint = computed(() => {
  if (commitDate.value) return undefined
  if (builtYearEstimate.value) return `Niet overgenomen: wordt ${builtYearEstimate.value.slice(0, 4)} (geschat: bouwjaar)`
  return 'Verplicht: geen datum in het document gevonden'
})
/** Overnemen needs a date the database can hold. */
const commitDateMissing = computed(() => !commitDate.value && !builtYearEstimate.value)

/**
 * Overnemen als rapportage: the judged values become an inquiry + samples, the
 * document enters inquiry-report/, the dossier leaves the queue -- and the
 * next one opens.
 *
 * With nothing taken over (the pipeline read nothing, or all of it was
 * refused) the commit still makes the inquiry, with the document and what
 * was read about it, and lands as `pending`: the person fills the samples
 * in by hand. That is the fallback for a document the model cannot read,
 * and since 2026-09-07 the only way to type a report in.
 */
async function commitDossier() {
  if (!data.value) return
  committing.value = true
  try {
    const r = await api.dataops.commit(data.value.dossier.id, {
      type: commitType.value ?? undefined,
      documentDate: commitDate.value ?? undefined,
      contractor: commitContractor.value ? Number(commitContractor.value) : undefined,
    })
    closed.value = 'accepted'
    committedInquiryId.value = r.inquiryId
    void studio.refreshCounts(null)
    if (r.audit) {
      toastSuccess(`Rapportage #${r.inquiryId} bijgewerkt: ${r.fields ?? 0} waarde${r.fields === 1 ? '' : 'n'} op ${r.samples} adres${r.samples === 1 ? '' : 'sen'}.`)
      await openNext(data.value.dossier.id, 'accepted')
      return
    }
    // Values the API could not put on an address (an unrecognised address, or
    // the document-level values of a dossier without a building) are kept as
    // text in the rapportage note. Say so: the reviewer's Overnemen on those
    // did not become data, and nothing else on the screen will tell them.
    const unlinked = r.unresolved?.length ?? 0
    if (unlinked > 0) {
      toastInfo(`${unlinked} waarde${unlinked === 1 ? '' : 'n'} niet aan een adres gekoppeld; staa${unlinked === 1 ? 't' : 'n'} als tekst in de notitie van de rapportage.`)
    }
    if (r.skippedRejected) {
      toastInfo(`${r.skippedRejected} overgenomen waarde${r.skippedRejected === 1 ? '' : 'n'} niet geschreven: het adres hoort niet bij dit dossier.`)
    }
    if (r.samples === 0) {
      toastSuccess(`Rapportage #${r.inquiryId} aangemaakt zonder adressen; vul die nu in.`)
      await router.push({ name: 'inquiry-edit-samples', params: { id: r.inquiryId } })
      return
    }
    // An address added by hand has a sample with nothing in it yet: go and
    // fill it in, the way a rapportage without addresses is filled in.
    if (r.emptySamples) {
      toastSuccess(`Rapportage #${r.inquiryId} aangemaakt met ${r.samples} adres${r.samples === 1 ? '' : 'sen'}, ${r.emptySamples} nog zonder gegevens; vul die nu in.`)
      await router.push({ name: 'inquiry-edit-samples', params: { id: r.inquiryId } })
      return
    }
    toastSuccess(`Rapportage #${r.inquiryId} aangemaakt met ${r.samples} adres${r.samples === 1 ? '' : 'sen'}.`)
    await openNext(data.value.dossier.id, 'accepted')
  } catch (e) {
    error.value = describeFailure(e, 'Het dossier kon niet als rapportage worden overgenomen.')
  } finally {
    committing.value = false
  }
}

/* -------------------------------------------------------------- timeline */

const KIND_LABEL: Record<string, string> = {
  received: 'ontvangen',
  extraction: 'gelezen',
  finding: 'controle',
  verdict: 'oordeel',
  remark: 'notitie',
  question: 'vraag',
  reply: 'antwoord',
  status: 'status',
}

const entries = computed(() => data.value?.entries ?? [])
const remarkText = ref('')
const remarkBusy = ref(false)

/** Where a question would go. Null (bulk drops) = no question box at all. */
const melderEmail = computed(() => data.value?.dossier.submitter?.email ?? null)
const questionText = ref('')
const questionBusy = ref(false)

/** Mail the melder a question; the reply lands on this same timeline. */
async function askQuestion() {
  const text = questionText.value.trim()
  if (!text || !data.value) return
  questionBusy.value = true
  try {
    await api.dataops.question(data.value.dossier.id, text)
    data.value.entries = [
      ...data.value.entries,
      {
        id: -Date.now(),
        at: new Date().toISOString(),
        kind: 'question',
        actorKind: 'reviewer',
        actor: null,
        text,
        visibleToMelder: true,
      },
    ]
    questionText.value = ''
  } catch (e) {
    error.value = describeFailure(e, 'De vraag kon niet worden verstuurd.')
  } finally {
    questionBusy.value = false
  }
}

/** Append a note to the timeline and show it without a reload. */
async function addRemark() {
  const text = remarkText.value.trim()
  if (!text || !data.value) return
  remarkBusy.value = true
  try {
    await api.dataops.remark(data.value.dossier.id, text)
    data.value.entries = [
      ...data.value.entries,
      {
        id: -Date.now(),
        at: new Date().toISOString(),
        kind: 'remark',
        actorKind: 'reviewer',
        actor: null,
        text,
        visibleToMelder: false,
      },
    ]
    remarkText.value = ''
  } catch (e) {
    error.value = describeFailure(e, 'De notitie kon niet worden opgeslagen.')
  } finally {
    remarkBusy.value = false
  }
}

function entryWhen(at: string): string {
  return new Date(at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) +
    ' ' + new Date(at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Straight on to the next one. Closing a dossier is the end of a decision,
 * not of a session: the reviewer's next move is always "the next oldest", and
 * a trip through the list between every two dossiers is what breaks the pace
 * (Yorick, 2026-08-29). The list is still one click away if they want it.
 */
async function openNext(closedId: number, outcome: DossierOutcome) {
  toastSuccess(`Dossier #${closedId} ${OUTCOME_LABEL[outcome]}.`)
  try {
    // Within the list the reviewer came from (Don, 2026-09-14): the filter
    // and sort ride along in the URL, so "next" means the next one of the
    // same kind, contractor or view -- not the oldest open dossier overall.
    // Page and offset are dropped: the closed one has just left the list.
    const opts = { ...toQueueOpts(parseQuery(route.query)), limit: 5, offset: 0 }
    const next = (await api.dataops.queue(opts)).find((r) => r.id !== closedId)
    if (next) {
      await router.push({ name: 'review-dossier', params: { id: next.id }, query: route.query })
      return
    }
  } catch {
    // Falling back to the list is fine; the close itself already succeeded.
  }
  await router.push({ name: 'review-queue', query: route.query })
}
/** The source was not allowed to establish this field — a QuickScan quoting us back. */
const isRefused = (f: IProposedField) => f.state === 'rejected'

const metaLine = computed(() => {
  const d = data.value?.dossier
  if (!d) return ''
  const when = new Date(d.receivedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return [d.externalRef ?? 'zonder kenmerk', `via ${CHANNEL_LABEL[d.channel] ?? d.channel}`, `ontvangen ${when}`].join(' · ')
})

const artifacts = computed(() => data.value?.artifacts ?? [])
const current = computed(() => artifacts.value[shown.value] ?? null)
/** An image the browser draws inline. */
const isImage = (mime: string | null) => isPreviewableImageMime(mime)
/**
 * An image it does not: a TIFF that arrived before ingest converted it, or
 * has not been ingested yet. An `<img>` on it is a blank pane with no hint
 * why; a card with the file and a download says what is going on (#333, 7).
 */
const isUnviewableImage = (mime: string | null) => !!mime && mime.startsWith('image/') && !isImage(mime)

/**
 * Which document a value came from. Selecting a value shows its document, so a
 * reviewer never has to work out which of four attachments is being quoted.
 */
function focus(f: IProposedField) {
  const i = artifacts.value.findIndex((a) => a.id === f.artifactId)
  if (i >= 0) shown.value = i
}

/** Signed links expire; opening in a new tab keeps the review screen intact. */
function openArtifact(link: string) {
  window.open(link, '_blank', 'noopener')
}

function toggleEdit(f: IProposedField) {
  editing.value = { ...editing.value, [f.id]: !editing.value[f.id] }
  if (editing.value[f.id]) focus(f)
}

/** Short form of what the commit will do with a bureau name, for the row. */
function contractorNote(f: IProposedField): { text: string; ok: boolean } | null {
  if (f.field !== 'contractor' || !contractors.value.length) return null
  const g = contractorGuess(f)
  return g
    ? { text: `wordt ${g.name}`, ok: true }
    : { text: 'niet in de lijst: wordt FunderMaps B.V., naam in de notitie', ok: false }
}

async function decide(f: IProposedField, outcome: VerdictOutcome) {
  busy.value = f.id
  try {
    await api.dataops.verdict({
      fieldId: f.id,
      outcome,
      finalValue: outcome === 'corrected' ? (corrections.value[f.id] ?? null) : null,
      note: notes.value[f.id]?.trim() || null,
      reviewSeconds: Math.round((Date.now() - openedAt) / 1000),
    })
    decided.value = { ...decided.value, [f.id]: outcome }
    editing.value = { ...editing.value, [f.id]: false }
    // Move to the next open value's document straight away: the reviewer's
    // next decision is almost always about a different page.
    const next = open.value.find((o) => o.id !== f.id)
    if (next) focus(next)
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppShell :crumb="data?.dossier.subject ?? 'Controle'" fill>
    <!-- One header, then two columns that fill the rest of the screen: the
         document on the left, the values on the right. Judging a citation means
         looking at the page it came from, so the page is never a click away. -->
    <header
      v-if="data"
      class="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-6 py-2.5"
    >
      <h1 class="text-lg min-w-0 truncate font-bold text-ink">
        {{ data.dossier.subject ?? 'Dossier' }}
      </h1>
      <Pill v-if="closed" :label="OUTCOME_LABEL[closed] ?? closed" tone="neutral" plain />
      <Pill v-else-if="nothingProposed" label="geen voorstellen" tone="red" plain />
      <Pill v-else :label="`${open.length} te beoordelen`" tone="blue" plain />
      <p class="text-sm min-w-0 flex-1 truncate font-mono text-faint">{{ metaLine }}</p>
      <Button label="Terug naar de lijst" @click="router.push({ name: 'review-queue', query: route.query })" />
    </header>

    <div
      v-if="error"
      class="text-md shrink-0 border-b border-red bg-red-tint px-6 py-2.5 text-red"
    >
      {{ error }}
    </div>

    <!-- Half and half, not a fixed inspector: this screen lives on a wide
         monitor, and the judging happens on the right. A 380px column left
         the document with the room and the decisions with the scrollbar. -->
    <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <!-- ------------------------------------------------------- document -->
      <section class="flex min-w-0 flex-col border-r border-line bg-sunken">
        <!-- Tabs only when there is something to choose between. -->
        <div
          v-if="artifacts.length > 1"
          class="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-4 pt-2.5"
        >
          <button
            v-for="(a, i) in artifacts"
            :key="a.id"
            type="button"
            class="text-md max-w-[220px] truncate border-b-2 px-3 pt-1.5 pb-2.5"
            :class="
              i === shown
                ? 'border-green font-bold text-ink'
                : 'border-transparent font-medium text-subtle hover:text-strong'
            "
            @click="shown = i"
          >
            {{ a.originalFilename ?? `Document ${i + 1}` }}
          </button>
        </div>

        <div class="min-h-0 flex-1">
          <img
            v-if="current && isImage(current.mimeType)"
            :src="current.accessLink"
            :alt="current.originalFilename ?? 'Brondocument'"
            class="h-full w-full object-contain"
          />
          <EmptyState v-else-if="current && isUnviewableImage(current.mimeType)">
            <span class="block font-semibold text-body">
              {{ current.originalFilename ?? 'Dit bestand' }} kan de browser niet tonen ({{ current.mimeType }}).
            </span>
            <span class="block">
              Een TIFF wordt bij het inlezen omgezet naar PNG; is dat nog niet gebeurd, download het
              bestand dan om het te bekijken.
            </span>
            <template #action>
              <Button label="Download" @click="openArtifact(current.accessLink)" />
            </template>
          </EmptyState>
          <iframe
            v-else-if="current"
            :src="current.accessLink"
            class="h-full w-full border-0"
            :title="current.originalFilename ?? 'Brondocument'"
          />
          <EmptyState v-else>Geen document bij dit dossier.</EmptyState>
        </div>

        <div
          v-if="current"
          class="text-sm flex shrink-0 items-center gap-3 border-t border-line bg-surface px-4 py-2 text-faint"
        >
          <span class="min-w-0 flex-1 truncate font-mono">{{ current.originalFilename }}</span>
          <span>{{ current.pageCount }} pag.</span>
          <span>{{ { text: 'tekst', vision: 'afbeelding', document: 'document' }[current.lane] ?? current.lane }}</span>
          <span v-if="data?.fields[0]" class="font-mono">{{ data.fields[0].model }}</span>
          <button
            type="button"
            class="font-medium text-blue-ink underline-offset-2 hover:underline"
            @click="openArtifact(current.accessLink)"
          >
            Nieuw tabblad
          </button>
        </div>
      </section>

      <!-- --------------------------------------------------------- values -->
      <aside class="flex min-h-0 flex-col bg-surface">
        <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <EmptyState v-if="loading">Dossier ophalen…</EmptyState>

          <Callout v-else-if="closed" tone="neutral" title="Dossier gesloten">
            Dossier <strong>{{ OUTCOME_LABEL[closed] ?? closed }}</strong>. Het staat niet meer in de controlelijst.
            <template v-if="committedInquiryId" #action>
              <Button
                :label="`Rapportage #${committedInquiryId} openen`"
                @click="router.push({ name: 'inquiry-view', params: { id: committedInquiryId } })"
              />
            </template>
          </Callout>

          <!-- Closed on an earlier visit (reached from the Afgewezen or
               Duplicaten tab): say how and why, and offer nothing to close. -->
          <Callout
            v-else-if="data?.dossier.outcome && !data.dossier.inquiryId"
            :tone="data.dossier.outcome === 'rejected' ? 'red' : 'neutral'"
            :title="`Dossier ${OUTCOME_LABEL[data.dossier.outcome] ?? data.dossier.outcome}`"
          >
            <template v-if="data.dossier.outcomeAt">Op {{ formatDate(data.dossier.outcomeAt) }}. </template>
            <template v-if="data.dossier.outcomeNote">Reden: “{{ data.dossier.outcomeNote }}”.</template>
            <template v-else>Zonder reden.</template>
            <template v-if="data.dossier.duplicateOf"> Duplicaat van dossier #{{ data.dossier.duplicateOf }}.</template>
          </Callout>

          <!-- Committed earlier: the rapportage is the place to add to it. -->
          <Callout
            v-else-if="data?.dossier.inquiryId"
            tone="green"
            title="Overgenomen als rapportage"
          >
            Dit dossier is rapportage <strong>#{{ data.dossier.inquiryId }}</strong> geworden.
            Aanvullen of corrigeren gebeurt daar.
            <template #action>
              <Button
                :label="`Rapportage #${data.dossier.inquiryId} openen`"
                @click="router.push({ name: 'inquiry-view', params: { id: data!.dossier.inquiryId! } })"
              />
            </template>
          </Callout>

          <Callout
            v-else-if="nothingProposed && !wasRead"
            tone="amber"
            title="Nog niet gelezen"
          >
            De pipeline heeft dit dossier nog niet verwerkt. Bekijk het document zelf, of wacht
            tot het gelezen is.
          </Callout>

          <Callout v-else-if="nothingProposed" tone="red" title="De pipeline vond niets">
            Het document is gelezen, maar er is geen enkele waarde uit gehaald. Bekijk het zelf:
            hoort het hier niet thuis, sluit het dossier dan hieronder. Bevat het wél gegevens,
            kies dan “Rapportage aanmaken, handmatig invullen”.
          </Callout>

          <Callout v-else-if="open.length === 0" tone="green" title="Alles beoordeeld">
            Er staan geen voorstellen meer open op dit dossier.
          </Callout>

          <Callout v-if="isAudit && !closed && data" tone="blue" title="Nalezing">
            Fundie heeft rapportage <strong>#{{ data.dossier.auditInquiryId }}</strong> opnieuw
            gelezen. Hieronder staat alleen wat afwijkt van de database of erin ontbreekt;
            {{ agreed.length }} waarde{{ agreed.length === 1 ? '' : 'n' }}
            {{ agreed.length === 1 ? 'komt' : 'komen' }} overeen. Overnemen werkt de rapportage bij,
            afkeuren laat de database staan.
            <template #action>
              <Button
                label="Rapportage openen"
                @click="router.push({ name: 'inquiry-view', params: { id: data!.dossier.auditInquiryId! } })"
              />
            </template>
          </Callout>

          <!-- Which addresses this dossier is about, and the say over them
               (#333, 3 and 4). Not on a nalezing: that one compares against
               the rapportage's own samples. -->
          <DossierAddresses
            v-if="!loading && data && !isAudit"
            :dossier-id="data.dossier.id"
            :addresses="addresses"
            :disabled="!!closed || !!data.dossier.outcome || !!data.dossier.inquiryId"
            @updated="onAddresses"
            @error="(m) => (error = m)"
          />

          <!-- One address group per section; the group folds. Inside, one
               compact row per proposal in two columns: this pane is half a
               wide screen now, and a row is label, value, citation, three
               buttons -- the drawer with the correction opens on request. -->
          <section v-for="group in openByAddress" :key="group.key" class="flex flex-col gap-2">
            <button
              v-if="openByAddress.length > 1 || group.key !== ''"
              type="button"
              class="flex items-center gap-2 pt-1 text-left"
              :aria-expanded="!collapsed[group.key]"
              @click="collapsed = { ...collapsed, [group.key]: !collapsed[group.key] }"
            >
              <span class="text-sm w-3 text-faint">{{ collapsed[group.key] ? '▸' : '▾' }}</span>
              <span class="studio-label">{{ group.address || 'HET RAPPORT' }}</span>
              <Pill v-if="group.own" label="pand van het dossier" tone="blue" plain />
              <Pill
                v-else-if="group.key && !group.resolved"
                label="adres niet herkend"
                tone="amber"
                plain
              />
              <Pill
                v-else-if="group.key"
                :label="group.state === 'confirmed' ? 'adres bevestigd' : 'adres te bevestigen'"
                :tone="group.state === 'confirmed' ? 'green' : 'amber'"
                plain
              />
              <span class="text-sm font-mono text-faint">{{ group.fields.length }} open</span>
            </button>

            <div v-if="!collapsed[group.key]" class="grid grid-cols-2 gap-2">
              <div
                v-for="f in group.fields"
                :key="f.id"
                class="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-2.5"
                :class="{ 'col-span-2': editing[f.id] }"
                @focusin="focus(f)"
                @click="focus(f)"
              >
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="text-sm font-semibold uppercase tracking-wide text-label">
                    {{ FIELD_LABEL[f.field] ?? f.field }}
                  </span>
                  <Pill v-if="isRefused(f)" label="bron niet toelaatbaar" tone="red" plain />
                  <Pill v-else-if="isInferred(f)" label="afgeleid" tone="amber" plain />
                  <Pill v-else-if="isSure(f)" label="hoge zekerheid" tone="green" plain />
                  <span v-if="f.confidence" class="text-sm ml-auto font-mono text-faint">{{ f.confidence }}</span>
                </div>

                <div class="flex items-baseline gap-1.5">
                  <span class="text-xl font-display font-bold text-ink">{{ displayValue(f) }}</span>
                  <span v-if="FIELD_UNIT[f.field] && f.value != null" class="text-sm text-muted">
                    {{ FIELD_UNIT[f.field] }}
                  </span>
                </div>

                <!-- The citation is what is being judged, not the value. -->
                <p
                  class="text-sm cursor-pointer border-l-2 border-line-strong pl-2 text-muted"
                  :class="{ 'line-clamp-2': !unclamped[f.id] }"
                  :title="unclamped[f.id] ? '' : 'Klik voor het hele citaat'"
                  @click.stop="unclamped = { ...unclamped, [f.id]: !unclamped[f.id] }"
                >
                  {{ f.evidence ?? 'Geen citaat meegegeven.' }}
                </p>

                <p
                  v-if="currentLabel(f)"
                  class="text-sm font-semibold"
                  :class="currentLabel(f)!.tone === 'red' ? 'text-red' : 'text-amber-ink'"
                >
                  {{ currentLabel(f)!.text }}
                </p>
                <p v-if="isRefused(f)" class="text-sm text-red">
                  Dit document mag dit veld niet vaststellen: een QuickScan of risicorapport toont
                  FunderMaps-gegevens.
                </p>
                <p
                  v-else-if="contractorNote(f)"
                  class="text-sm"
                  :class="contractorNote(f)!.ok ? 'text-green-ink' : 'text-amber-ink'"
                >
                  {{ contractorNote(f)!.text }}
                </p>

                <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  <Button
                    variant="primary"
                    label="Overnemen"
                    :disabled="busy === f.id || isRefused(f)"
                    @click="decide(f, 'confirmed')"
                  />
                  <Button
                    variant="danger"
                    label="Afkeuren"
                    :disabled="busy === f.id"
                    @click="decide(f, 'rejected')"
                  />
                  <Button
                    :variant="editing[f.id] ? 'secondary' : 'ghost'"
                    :label="editing[f.id] ? 'Sluiten' : 'Aanpassen…'"
                    :disabled="busy === f.id"
                    @click="toggleEdit(f)"
                  />
                </div>

                <!-- The drawer: correction and toelichting, only when asked. -->
                <div
                  v-if="editing[f.id]"
                  class="mt-1 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-divider pt-2.5"
                >
                  <Combobox
                    v-if="f.field === 'foundation_type'"
                    v-model="corrections[f.id]"
                    label="Andere waarde"
                    :options="FOUNDATION_TYPE_CODE_OPTIONS"
                  />
                  <Field
                    v-else-if="f.field === 'inquiry_type'"
                    v-model="corrections[f.id]"
                    kind="select"
                    label="Andere waarde"
                    :options="INQUIRY_TYPE_CODE_OPTIONS"
                  />
                  <Field
                    v-else-if="f.field === 'document_date'"
                    v-model="corrections[f.id]"
                    kind="date"
                    label="Andere datum"
                  />
                  <Combobox
                    v-else-if="f.field === 'contractor' && contractors.length"
                    v-model="corrections[f.id]"
                    label="Andere uitvoerder"
                    placeholder="Typ (een deel van) de naam"
                    :options="contractorOptions"
                  />
                  <Field v-else v-model="corrections[f.id]" label="Andere waarde" />

                  <Field
                    v-model="notes[f.id]"
                    kind="textarea"
                    :rows="2"
                    label="Toelichting"
                    hint="Waarom klopt het niet? Dit stuurt de volgende versie."
                  />

                  <!-- The value is right, the address is not: move it (#333, 4).
                       Takes effect at once; the group changes under your hands. -->
                  <label v-if="moveTargets.length" class="col-span-2 flex flex-col gap-1">
                    <span class="text-sm font-semibold uppercase tracking-wide text-label">Hoort bij adres</span>
                    <select
                      class="studio-control rounded-md border border-line bg-sunken px-2 py-1.5"
                      :value="f.addressId ?? ''"
                      :disabled="busy === f.id"
                      @change="moveField(f, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="" disabled>{{ f.addressText ? `niet herkend: ${f.addressText}` : 'het rapport als geheel' }}</option>
                      <option v-for="t in moveTargets" :key="t.value" :value="t.value">{{ t.label }}</option>
                    </select>
                  </label>

                  <div class="col-span-2 flex flex-wrap gap-1.5">
                    <Button
                      variant="primary"
                      label="Aanpassen en overnemen"
                      :disabled="busy === f.id || !corrections[f.id]"
                      @click="decide(f, 'corrected')"
                    />
                    <Button
                      variant="danger"
                      label="Afkeuren met toelichting"
                      :disabled="busy === f.id"
                      @click="decide(f, 'rejected')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Panel v-if="isAudit && agreed.length" caption="KOMT OVEREEN" :meta="String(agreed.length)">
            <p class="text-sm mb-1.5 text-muted">
              Gelezen uit het document en gelijk aan wat de database al heeft. Geen actie nodig.
            </p>
            <ul class="flex flex-wrap gap-x-3 gap-y-1">
              <li v-for="f in agreed" :key="f.id" class="text-sm text-muted">
                <span class="font-semibold text-body">{{ FIELD_LABEL[f.field] ?? f.field }}</span>
                {{ displayValue(f) }}<template v-if="addressLine(f)"> · {{ addressLine(f) }}</template>
              </li>
            </ul>
          </Panel>

          <Panel v-if="settled.length" caption="BEOORDEELD" :meta="String(settled.length)">
            <ul class="flex flex-col gap-2">
              <li
                v-for="f in settled"
                :key="f.id"
                class="text-md flex gap-2.5 border-b border-canvas pb-2 last:border-b-0 last:pb-0"
              >
                <span aria-hidden="true" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span class="min-w-0">
                  <span class="block font-semibold text-body">
                    {{ FIELD_LABEL[f.field] ?? f.field }} — {{ displayValue(f) }}
                    <span v-if="FIELD_UNIT[f.field] && f.value != null" class="font-normal text-muted">
                      {{ FIELD_UNIT[f.field] }}
                    </span>
                  </span>
                  <span class="block text-muted">
                    {{ VERDICT_LABEL[decided[f.id]!] ?? decided[f.id] }}<template
                      v-if="decided[f.id] === 'corrected' && corrections[f.id]"
                    >
                      naar {{ labelValue(f.field, corrections[f.id]) }}</template
                    ><template v-if="addressLine(f)"> · {{ addressLine(f) }}</template>
                  </span>
                </span>
              </li>
            </ul>
          </Panel>

          <!-- The dossier's timeline: everything that happened, in order. The
               melder's status page shows the visible subset of these same rows,
               so reviewer and melder can never see two different stories. -->
          <Panel v-if="!loading && data" caption="VERLOOP" :meta="String(entries.length)">
            <ul class="flex flex-col gap-1.5">
              <li v-for="e in entries" :key="e.id" class="text-md flex gap-2.5">
                <span class="text-sm w-[84px] shrink-0 font-mono text-faint">{{ entryWhen(e.at) }}</span>
                <span class="min-w-0">
                  <span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ KIND_LABEL[e.kind] ?? e.kind }}</span>
                  <span class="break-words text-muted">{{ e.text }}</span>
                </span>
              </li>
            </ul>
            <div class="mt-3 flex gap-2">
              <input
                v-model="remarkText"
                type="text"
                class="studio-control flex-1 rounded-md border border-line bg-sunken px-2 py-1.5"
                placeholder="Notitie voor het dossier (intern)"
                aria-label="Notitie toevoegen"
                @keydown.enter="addRemark"
              />
              <Button label="Noteer" :disabled="remarkBusy || !remarkText.trim()" @click="addRemark" />
            </div>
            <!-- Only when there is somebody to mail: bulk drops carry no melder,
                 and a permanently grey box on 99% of the queue is noise. -->
            <!-- Also after closure: the melder writes back after the afronding and
                 the answer must come from here, without reopening (Don, 2026-09-15). -->
            <div v-if="melderEmail" class="mt-2 flex gap-2">
              <input
                v-model="questionText"
                type="text"
                class="studio-control flex-1 rounded-md border border-line bg-sunken px-2 py-1.5"
                :placeholder="`${data?.dossier.outcome ? 'Reactie' : 'Vraag'} aan de melder (gemaild naar ${melderEmail})`"
                aria-label="Vraag aan de melder"
                @keydown.enter="askQuestion"
              />
              <Button
                label="Verstuur vraag"
                :disabled="questionBusy || !questionText.trim()"
                @click="askQuestion"
              />
            </div>
          </Panel>

        </div>
        <!-- Closing the whole dossier, pinned to the bottom of the pane so
             "Overnemen als rapportage" is never a scroll away. Always
             available, because "this is not about anything" is a judgement
             about the document, not about one of its values. -->
        <div
          v-if="!loading && data && !closed && !data.dossier.outcome"
          class="shrink-0 border-t border-line bg-surface p-4"
        >
          <Panel caption="DOSSIER SLUITEN">
            <div class="flex flex-col gap-3">
              <!-- What "Overnemen als rapportage" writes on the inquiry itself,
                   as controls: prefilled with what was taken over, sent with
                   the commit. A missing date used to fall back to the day the
                   dossier arrived, which is almost never the date of the report. -->
              <p v-if="isAudit" class="text-md text-muted">
                Rapportage <strong class="text-body">#{{ data?.dossier.auditInquiryId }}</strong> wordt
                bijgewerkt met {{ taken.length }} overgenomen waarde{{ taken.length === 1 ? '' : 'n' }};
                er wordt niets nieuws aangemaakt.
              </p>
              <div v-else-if="wasRead && open.length === 0" class="grid grid-cols-3 gap-x-3 gap-y-2">
                <Field
                  v-model="commitType"
                  kind="select"
                  label="Soort"
                  :options="INQUIRY_TYPE_CODE_OPTIONS"
                  empty-label="Afleiden van het label"
                  :hint="commitType ? undefined : derivedTypeHint"
                />
                <Field
                  v-model="commitDate"
                  kind="date"
                  label="Datum rapport"
                  :hint="commitDateHint"
                />
                <Combobox
                  v-model="commitContractor"
                  label="Uitvoerder"
                  :options="contractorOptions"
                  placeholder="Typ (een deel van) de naam"
                  empty-label="FunderMaps B.V."
                  :hint="
                    commitContractor
                      ? undefined
                      : contractorUnmatched
                        ? `“${contractorUnmatched}” staat niet in de lijst: wordt FunderMaps B.V., naam in de notitie`
                        : 'Niet overgenomen: wordt FunderMaps B.V.'
                  "
                />
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  :label="isAudit ? (taken.length ? 'Wijzigingen doorvoeren' : 'Afronden zonder wijzigingen') : taken.length ? 'Overnemen als rapportage' : 'Rapportage aanmaken, handmatig invullen'"
                  :disabled="committing || closing || open.length > 0 || !wasRead || commitDateMissing"
                  :title="open.length > 0 ? 'Beoordeel eerst alle voorstellen' : !wasRead ? 'Wacht tot het document gelezen is' : ''"
                  @click="commitDossier"
                />
                <Button
                  v-if="!isAudit"
                  label="Sluiten zonder rapportage"
                  :disabled="closing || committing || open.length > 0"
                  :title="open.length > 0 ? 'Beoordeel eerst alle voorstellen' : 'Het dossier is afgehandeld, maar er komt geen rapportage in de database'"
                  @click="closeDossier('accepted')"
                />
                <Button
                  label="Geen gegevens"
                  :disabled="closing || committing || open.length > 0"
                  :title="open.length > 0 ? 'Er staan nog voorstellen open: neem ze over of keur ze af' : 'Gelezen, niets bruikbaars gevonden'"
                  @click="closeDossier('no_data')"
                />
                <Button
                  variant="danger"
                  label="Afwijzen"
                  :disabled="closing || committing"
                  @click="closeDossier('rejected')"
                />
                <Button
                  label="Duplicaat"
                  :disabled="closing || committing"
                  @click="closeDossier('duplicate')"
                />
              </div>

              <!-- Two ways to be done with a dossier, and they are not the same
                   thing: one makes a rapportage, the other only closes (#333, 9). -->
              <p v-if="!isAudit" class="text-sm text-label">
                <strong class="font-semibold text-muted">Overnemen als rapportage</strong> zet de
                overgenomen waarden als rapportage in de database.
                <strong class="font-semibold text-muted">Sluiten zonder rapportage</strong> handelt het
                dossier af zonder iets in de database te zetten, bijvoorbeeld als de rapportage er al
                staat.
              </p>

              <Field
                id="review-close-note"
                v-model="closeNote"
                kind="textarea"
                :rows="1"
                label="Reden"
                :error="noteError"
                hint="Verplicht bij afwijzen of duplicaat. Kort is prima: ‘foto van een kat’."
              />
            </div>
          </Panel>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
