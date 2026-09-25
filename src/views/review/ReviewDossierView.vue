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
import RecordRecoveryPanel from '@/components/Review/RecordRecoveryPanel.vue'
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
  VALUE_LABEL,
  VERDICT_LABEL,
  derivedInquiryType,
  displayValue as labelValue,
  formatDate,
} from '@/services/reviewLabels'
import { CLOSE_TEMPLATES, CLOSE_TEMPLATE_OPTIONS, OUTCOME_HINT } from '@/services/closeTemplates'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { SelectOption } from '@/services/options'
import { useStudioStore } from '@/stores/studio'
import { useSessionStore } from '@/stores/session'
import { confirmAction } from '@/services/confirm'
import { toastError, toastInfo, toastSuccess } from '@/services/toast'
import { splitQuoted, tidyMailText } from '@/services/mailQuote'
import { addressSetKey, hiddenMembers, spreadSets } from '@/utils/spread'

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
const session = useSessionStore()

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
/**
 * A standard answer picked for the note (Don, 2026-09-17: the reasons repeat,
 * and the note is the mail the melder gets). Picking one fills the note when
 * it is empty or still holds the previous pick; hand-typed text is never
 * overwritten. The outcome stays the reviewer's click.
 */
const closeTemplate = ref<string | null>(null)
watch(closeTemplate, (v, prev) => {
  const next = CLOSE_TEMPLATES.find((t) => t.value === v)
  const prevText = CLOSE_TEMPLATES.find((t) => t.value === prev)?.text
  if (next && (!closeNote.value.trim() || closeNote.value === prevText)) closeNote.value = next.text
})
const closeTemplateHint = computed(() => {
  const t = CLOSE_TEMPLATES.find((x) => x.value === closeTemplate.value)
  return t ? `Hoort bij “${OUTCOME_HINT[t.outcome]}”; pas de tekst aan waar nodig.` : 'Vult de reden met een vaste tekst; daarna aanpassen waar nodig.'
})
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
  closeTemplate.value = null
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
  resetDossierForms()
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
/**
 * A range's values (Worker #186): one card per set, one section per range.
 * The card is the set's first field; `membersOf` gives the rest.
 */
const openSpread = computed(() => spreadSets(open.value))
const settledSpread = computed(() => spreadSets(settled.value, (f) => `${decided.value[f.id]}|${corrections.value[f.id] ?? ''}`))
const hiddenOpen = computed(() => hiddenMembers(openSpread.value))
const hiddenSettled = computed(() => hiddenMembers(settledSpread.value))
const membersOf = (f: IProposedField): IProposedField[] =>
  openSpread.value.get(f.id) ?? settledSpread.value.get(f.id) ?? [f]
/** What the reviewer has left to judge: a range counts once. */
const openCards = computed(() => open.value.length - hiddenOpen.value.size)
const settledCards = computed(() => settled.value.filter((f) => !hiddenSettled.value.has(f.id)))

const openByAddress = computed(() => {
  const groups = new Map<string, IProposedField[]>()
  for (const f of open.value) {
    if (hiddenOpen.value.has(f.id)) continue
    const set = openSpread.value.get(f.id)
    const key = set ? addressSetKey(set) : (f.addressId ?? f.addressText ?? '')
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.startsWith('range:') && !b.startsWith('range:') ? -1 : 0))
    .map(([key, fields]) => {
      const set = openSpread.value.get(fields[0]!.id)
      if (set) {
        const labels = set.map((m) => addressLine(m) ?? m.addressId ?? '')
        return {
          key,
          address: labels.length > 1 ? `${labels[0]} … ${labels[labels.length - 1]}` : (labels[0] ?? ''),
          resolved: true,
          state: null,
          own: false,
          /** Every address the range covers, for the fold under the title. */
          spread: labels,
          fields,
        }
      }
      const a = addressOf(fields[0]!)
      return {
        key,
        /** The group title: the resolved address, else what the document wrote. */
        address: key === '' ? '' : (a?.label ?? fields[0]!.addressText ?? key),
        resolved: fields.some((f) => f.addressId),
        state: a?.state ?? null,
        own: a?.own ?? false,
        spread: null as string[] | null,
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
 * So does Sluiten zonder rapportage (`accepted` without a commit): without a
 * note the mail falls back to "overgenomen in de Funderingsdatabase", which is
 * not true when nothing was taken over (Don, 2026-09-25, FM2026-000359).
 */
const NOTE_REQUIRED: ReadonlySet<DossierOutcome> = new Set(['rejected', 'duplicate', 'accepted'])
/**
 * Set when Afwijzen or Duplicaat was clicked without a reason. The buttons stay
 * clickable -- a greyed-out button does not say what it wants -- and the note
 * field says it instead (#333, point 10).
 */
const noteMissingFor = ref<DossierOutcome | null>(null)
const noteError = computed(() =>
  noteMissingFor.value && !closeNote.value.trim()
    ? `Geef eerst een reden: waarom wordt dit dossier ${noteMissingFor.value === 'duplicate' ? 'als duplicaat gesloten' : noteMissingFor.value === 'accepted' ? 'gesloten zonder rapportage' : 'afgewezen'}?`
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
/**
 * Herstel vastleggen (#341) shows where it is likely wanted -- a melding about
 * a herstel, or one already recorded -- and on request elsewhere.
 */
const askedForRecovery = ref(false)
const recordedRecoveryId = ref<number | null>(null)
const recoveryId = computed(() => recordedRecoveryId.value ?? data.value?.dossier.recoveryId ?? null)
const showRecovery = computed(
  () =>
    !!data.value &&
    !isAudit.value &&
    (!!recoveryId.value ||
      askedForRecovery.value ||
      // Form dossiers carry topicLabel; the #340 loket import stores the label as topic.
      /herstel/i.test(`${data.value.dossier.payload?.topicLabel ?? ''} ${data.value.dossier.payload?.topic ?? ''}`)),
)
const melderRecoveryHint = computed(() => {
  const v = data.value?.dossier.payload?.answers?.recoveryType
  return v == null || v === '' ? null : String(v)
})
function onRecoveryRecorded(id: number) {
  recordedRecoveryId.value = id
  toastInfo(`Herstel #${id} vastgelegd. Sluit het dossier nu af, met of zonder rapportage.`)
}

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
/**
 * Add the bureau the cover named but the list does not have (#194).
 *
 * 465 of the 489 names the pipeline has read match no row, so without this
 * the reviewer's only options were to leave it at FunderMaps B.V. -- the name
 * then survives only as free text in the note -- or to ask an administrator.
 * Three of the four people doing the reviewing are not one.
 *
 * It asks first, because `application.contractor` has no delete: a typo is
 * permanent and every organisation sees it. And it can come back with a row
 * the reviewer did not create, when the name turns out to be another spelling
 * of one we already had; saying so is more use than pretending we added it.
 */
const addingContractor = ref(false)
const canAddContractor = computed(() => session.canApprove && !!contractorUnmatched.value)
async function addContractor() {
  const name = contractorUnmatched.value
  if (!name || addingContractor.value) return
  const ok = await confirmAction({
    title: `“${name}” toevoegen aan de lijst?`,
    body: 'De lijst is van alle organisaties en er is geen verwijderknop. Controleer de schrijfwijze.',
    confirmLabel: 'Toevoegen',
  })
  if (!ok) return
  addingContractor.value = true
  try {
    const row = await api.contractor.create(name)
    if (!contractors.value.some((c) => c.id === row.id)) contractors.value = [...contractors.value, row]
    commitContractor.value = String(row.id)
    if (row.created) toastSuccess(`“${row.name}” toegevoegd en geselecteerd`)
    else toastInfo(`Stond al in de lijst als “${row.name}” — die is geselecteerd`)
  } catch (e) {
    toastError(describeFailure(e, 'Toevoegen van de uitvoerder is niet gelukt'))
  } finally {
    addingContractor.value = false
  }
}
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
/**
 * The melding as the melder wrote it (#350): topic, the answers per topic, the
 * toelichting, NAW. All of it was on the dossier; the screen never showed it.
 */
const ANSWER_LABEL: Record<string, string> = {
  foundationType: 'Funderingstype volgens melder',
  recoveryType: 'Soort herstel',
  riskDirection: 'Risico volgens melder',
  riskClass: 'Risicoklasse volgens melder',
  registration: 'Registratienummer',
}
const REPORTER_LABEL: Record<string, string> = {
  resident: 'bewoner',
  owner: 'eigenaar',
  broker: 'makelaar',
  'makelaar-taxateur': 'makelaar / taxateur',
  company: 'bedrijf',
  municipality: 'gemeente',
  other: 'anders',
}
const meldingAnswers = computed(() => {
  const a = data.value?.dossier.payload?.answers
  if (!a || typeof a !== 'object') return [] as { label: string; value: string }[]
  return Object.entries(a)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => ({ label: ANSWER_LABEL[k] ?? k, value: Array.isArray(v) ? v.join(', ') : String(v) }))
})
const meldingNaw = computed(() => {
  const s = data.value?.dossier.submitter
  if (!s) return [] as { label: string; value: string }[]
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'Naam', value: s.name },
    { label: 'E-mail', value: s.email },
    { label: 'Telefoon', value: s.phone },
    { label: 'Organisatie', value: s.company },
    { label: 'Melder', value: s.type ? (REPORTER_LABEL[s.type] ?? s.type) + (s.isOwner ? ', eigenaar' : '') : s.isOwner ? 'eigenaar' : null },
  ]
  return rows.filter((r): r is { label: string; value: string } => !!r.value)
})
/**
 * What FunderMaps has for the pand now, beside the melder's claim (Don,
 * 2026-09-25, dossier 5594): the risk when they say it is higher or lower, the
 * foundation type when they name another one. The class is the worst of the
 * four risks, as on the map. Empty until the API sends buildingModel (#215).
 */
const RISK_PART: [string, 'drystandRisk' | 'dewateringDepthRisk' | 'bioInfectionRisk' | 'unclassifiedRisk'][] = [
  ['droogstand', 'drystandRisk'],
  ['ontwateringsdiepte', 'dewateringDepthRisk'],
  ['bacteriële aantasting', 'bioInfectionRisk'],
  ['overig', 'unclassifiedRisk'],
]
const modelNow = computed(() => {
  const m = data.value?.dossier.buildingModel
  const a = data.value?.dossier.payload?.answers
  if (!m || !a || typeof a !== 'object') return [] as { label: string; value: string }[]
  const rows: { label: string; value: string }[] = []
  if (a.riskDirection || a.riskClass) {
    const parts = RISK_PART.filter(([, k]) => m[k]).map(([name, k]) => `${name} ${m[k]!.toUpperCase()}`)
    const worst = RISK_PART.map(([, k]) => m[k]).filter((v): v is string => !!v).sort().reverse()[0]
    rows.push({ label: 'Risico nu in FunderMaps', value: worst ? `${worst.toUpperCase()} (${parts.join(', ')})` : 'geen risico berekend' })
  }
  if (a.foundationType) {
    rows.push({ label: 'Funderingstype nu in FunderMaps', value: m.foundationType ? labelValue('foundation_type', m.foundationType) : 'onbekend' })
  }
  return rows
})
const hasMelding = computed(() => !!(data.value?.dossier.payload?.topicLabel || data.value?.dossier.payload?.note || meldingAnswers.value.length || meldingNaw.value.length))
/** Which sent mails are unfolded in the verloop (#350). */
const shownMail = ref<Record<number, boolean>>({})
const mailOf = (e: { body?: Record<string, unknown> | null }) => {
  const m = e.body?.mail as { subject?: string; text?: string; to?: string } | undefined
  return m && m.text ? m : null
}
/**
 * #356 (Don, dossier 5145): melder replies and reviewer questions are mails too,
 * so they get the same card as our automated mails. The melder's quoted history
 * is folded away by default (Don: "yes", one click to show). When the API starts
 * storing body.mail on these entries, subject and recipient show up by themselves.
 */
const MAIL_KINDS = new Set(['reply', 'question'])
const shownQuote = ref<Record<number, boolean>>({})
const mailCards = computed(() => {
  const out: Record<number, { own: string; quoted: string; subject?: string; attachments: number }> = {}
  for (const e of data.value?.entries ?? []) {
    if (!MAIL_KINDS.has(e.kind)) continue
    const mail = mailOf(e)
    const { own, quoted } = splitQuoted(mail?.text ?? e.text)
    out[e.id] = { own: tidyMailText(own), quoted: tidyMailText(quoted), subject: mail?.subject, attachments: Number(e.body?.attachments ?? 0) || 0 }
  }
  return out
})

/**
 * Waarde toevoegen (Don's casus 2, 2026-09-15): a value the reviewer sees and
 * the model did not. Lands as a confirmed proposal on the dossier with a
 * "human added" finding, so the commit takes it and the pipeline learns.
 * Sample fields only; soort/datum/uitvoerder have the close panel.
 */
const ADD_FIELDS = [
  'foundation_type', 'built_year', 'foundation_quality', 'wood_type', 'wood_level', 'wood_encroachment',
  'wood_penetration_depth', 'foundation_depth', 'groundlevel', 'groundwater_level', 'pile_head_level',
  'pile_tip_level', 'pile_diameter_top', 'pile_diameter_bottom', 'pile_distance_length',
  'concrete_charger_length', 'damage_cause', 'damage_characteristics', 'crack_facade_front_type',
  'crack_facade_back_type', 'crack_indoor_type', 'skewed_parallel', 'skewed_perpendicular',
  'enforcement_term', 'recovery_advised', 'recovery_note', 'follow_up_note',
] as const
const ADD_FIELD_OPTIONS = ADD_FIELDS.map((f) => ({ value: f, label: FIELD_LABEL[f] ?? f }))
const addOpen = ref(false)
const addField = ref<string | null>(null)
const addValue = ref('')
const addAddress = ref<string | null>(null)
const addNote = ref('')
const addBusy = ref(false)
const addValueOptions = computed(() => {
  const map = addField.value ? VALUE_LABEL[addField.value] : undefined
  return map ? Object.entries(map).map(([value, label]) => ({ value, label })) : null
})
const addValueKind = computed(() => {
  if (!addField.value) return 'text'
  if (addValueOptions.value) return 'select'
  if (FIELD_UNIT[addField.value] || ['built_year', 'skewed_parallel', 'skewed_perpendicular', 'foundation_depth', 'groundlevel'].includes(addField.value)) return 'number'
  return 'text'
})
const addAddressOptions = computed(() =>
  (data.value?.addresses ?? [])
    .filter((a) => a.addressId)
    .map((a) => ({ value: a.addressId!, label: (a.label ?? a.addressText ?? a.addressId!) + (a.own ? ' (pand van de melding)' : '') })),
)
async function addManualValue() {
  if (!addField.value || !addValue.value.trim() || addBusy.value) return
  addBusy.value = true
  try {
    await api.dataops.addValue(Number(route.params.id), {
      field: addField.value,
      value: addValue.value.trim(),
      addressId: addAddress.value || null,
      note: addNote.value.trim() || null,
    })
    toastSuccess(`${FIELD_LABEL[addField.value] ?? addField.value} toegevoegd.`)
    addValue.value = ''
    addNote.value = ''
    addOpen.value = false
    await load()
  } catch (e) {
    error.value = describeFailure(e, 'De waarde kon niet worden toegevoegd.')
  } finally {
    addBusy.value = false
  }
}

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
/**
 * Overnemen needs a date the database can hold — but a nalezing updates a
 * rapportage that already has one. Don, 2026-09-19 (dossier 2492): every
 * proposal judged, "Wijzigingen doorvoeren" dead and no tooltip saying why.
 * Cause: commitDate is filled from the values the reviewer TOOK OVER, and on
 * that dossier the date agreed with the database, so it was never taken over
 * and the commit believed there was no date at all.
 */
const commitDateMissing = computed(() => !isAudit.value && !commitDate.value && !builtYearEstimate.value)

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

/**
 * The per-dossier state declared below `load()`. Until 2026-09-22 `load()`
 * missed these, so after "Overnemen als rapportage" the next dossier opened
 * with the previous one's Datum rapport, Soort and Uitvoerder still filled
 * (Don, dossier 5297) -- and a half-typed remark or question would have been
 * posted on the wrong dossier. Cleared here; the prefill watch then fills the
 * commit controls from the new dossier's own taken-over values.
 */
function resetDossierForms() {
  commitType.value = null
  commitDate.value = null
  commitContractor.value = null
  noteMissingFor.value = null
  shownMail.value = {}
  shownQuote.value = {}
  addOpen.value = false
  addField.value = null
  addValue.value = ''
  addAddress.value = null
  addNote.value = ''
  remarkText.value = ''
  questionText.value = ''
}

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

/**
 * The melder had the last word: the newest entry is their reply. Mirrors the
 * API's state=replied, which is what the "Reactie ontvangen" tab lists.
 */
const melderRepliedLast = computed(() => {
  const es = data.value?.entries ?? []
  for (let i = es.length - 1; i >= 0; i--) {
    const k = es[i]!.kind
    if (k === 'reply') return true
    if (k === 'question' || k === 'remark' || k === 'status' || k === 'verdict') return false
  }
  return false
})

/**
 * Don, 2026-09-19: a reply is often dealt with by phone or from someone's own
 * mailbox. Nothing lands on the dossier, so it stays in "Reactie ontvangen"
 * for ever. One click writes the notitie that clears it — the same mechanism
 * the API already uses, made visible.
 */
async function markReplyHandled() {
  remarkText.value = 'Reactie afgehandeld buiten het systeem'
  await addRemark()
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
/**
 * Why the pipeline refused a value, for the BEOORDEELD list (Don, 2026-09-25,
 * dossier 5553: "23 geweigerd", but where?). A refusal is a rejection nobody
 * clicked, so without this line it reads as the reviewer's own "Afgewezen".
 */
const refusedReason = (f: IProposedField): string | null => {
  if (f.state !== 'rejected' || !f.evidence?.startsWith('bron niet toelaatbaar')) return null
  return f.evidence.split('\n')[0]!.replace(/^bron niet toelaatbaar:\s*/, '')
}
/**
 * Something typed in the Aanpassen drawer means the reviewer is not taking the
 * value as read. The card's own Overnemen would take it anyway, with the note
 * attached (Don, 2026-09-25, dossier 5582) -- so it waits while the drawer holds input.
 */
const draftedChange = (f: IProposedField) => !!editing.value[f.id] && (!!corrections.value[f.id] || !!notes.value[f.id]?.trim())

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
/**
 * No document at all: the melder asked something, and answering is the whole
 * job. The screen drops the review furniture and puts the question where the
 * document would be (Don, 2026-09-17: "half the closures had nothing to review").
 */
const answerMode = computed(() => !!data.value && !isAudit.value && artifacts.value.length === 0)
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
  // A range card decides every address it stands for, in one call (#186).
  const ids = membersOf(f).map((m) => m.id)
  busy.value = f.id
  try {
    await api.dataops.verdict({
      fieldIds: ids,
      outcome,
      finalValue: outcome === 'corrected' ? (corrections.value[f.id] ?? null) : null,
      note: notes.value[f.id]?.trim() || null,
      reviewSeconds: Math.round((Date.now() - openedAt) / 1000),
    })
    const settledNow = { ...decided.value }
    const correctedNow = { ...corrections.value }
    for (const id of ids) {
      settledNow[id] = outcome
      if (outcome === 'corrected') correctedNow[id] = corrections.value[f.id] ?? ''
    }
    decided.value = settledNow
    corrections.value = correctedNow
    editing.value = { ...editing.value, [f.id]: false }
    // Move to the next open value's document straight away: the reviewer's
    // next decision is almost always about a different page.
    const next = open.value.find((o) => !ids.includes(o.id))
    if (next) focus(next)
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}

/**
 * Undo a verdict while the dossier is open (#355): an accidental click on the
 * wrong value should not need a system fix. The row returns to the open list;
 * the earlier decision stays in the log.
 */
async function reopen(f: IProposedField) {
  const ids = membersOf(f).map((m) => m.id)
  busy.value = f.id
  try {
    for (const id of ids) await api.dataops.reopenField(id)
    // The API sets them pending; mirror that, or a refused value stays refused on screen.
    for (const x of data.value?.fields ?? []) if (ids.includes(x.id)) x.state = 'pending'
    const rest = { ...decided.value }
    const cleared = { ...corrections.value }
    for (const id of ids) {
      delete rest[id]
      cleared[id] = ''
    }
    decided.value = rest
    corrections.value = cleared
    toastInfo(`${FIELD_LABEL[f.field] ?? f.field} staat weer open.`)
    focus(f)
  } catch (e) {
    error.value = describeFailure(e, 'De beoordeling kon niet worden heropend.')
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
      <Pill v-else :label="`${openCards} te beoordelen`" tone="blue" plain />
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
          <div v-else-if="answerMode" class="flex h-full flex-col gap-3 overflow-auto p-6">
            <p class="text-sm font-semibold uppercase text-label">Vraag van de melder</p>
            <p v-if="data?.dossier.payload?.topicLabel" class="text-lg font-bold text-ink">{{ data.dossier.payload.topicLabel }}</p>
            <p v-for="a in meldingAnswers" :key="a.label" class="text-md"><span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ a.label }}</span><span class="text-muted">{{ a.value }}</span></p>
            <p v-if="data?.dossier.payload?.note" class="text-md whitespace-pre-wrap rounded-lg border border-line bg-surface px-4 py-3 text-body">{{ data.dossier.payload.note }}</p>
            <p v-else class="text-md text-muted">Geen toelichting meegestuurd.</p>
            <p v-if="meldingNaw.length" class="text-sm text-faint"><template v-for="(n, i) in meldingNaw" :key="n.label"><span v-if="i">&nbsp;·&nbsp;</span>{{ n.label }}: <span class="text-muted">{{ n.value }}</span></template></p>
            <p class="text-sm text-muted">Geen document bij dit dossier: kies rechtsonder een standaardantwoord of schrijf er een, en sluit het dossier.</p>
          </div>
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
              <Pill v-if="group.spread" :label="`geldt voor ${group.spread.length} adressen`" tone="blue" plain />
              <Pill v-else-if="group.own" label="pand van het dossier" tone="blue" plain />
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

            <!-- A range (#186): what it covers, folded. One Overnemen below decides every address. -->
            <details v-if="group.spread && !collapsed[group.key]" class="text-sm pl-5 text-muted">
              <summary class="cursor-pointer">Toon de {{ group.spread.length }} adressen</summary>
              <p class="mt-1">{{ group.spread.join(' · ') }}</p>
            </details>

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
                    :disabled="busy === f.id || isRefused(f) || draftedChange(f)"
                    :title="draftedChange(f) ? 'U heeft hieronder iets ingevuld: kies Aanpassen en overnemen of Afkeuren met toelichting' : ''"
                    @click="decide(f, 'confirmed')"
                  />
                  <!-- No bare Afkeuren here (Don, #348): a rejection is either a
                       correction or a reason, both live in the Aanpassen panel. -->
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
                  <label v-if="moveTargets.length && membersOf(f).length === 1" class="col-span-2 flex flex-col gap-1">
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
                      :disabled="busy === f.id || !notes[f.id]?.trim()"
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

          <!-- What the person sees and the model did not: a value typed here is a
               confirmed proposal with a "human added" finding (Don's casus 2). -->
          <Panel v-if="!loading && data && !closed && !data.dossier.outcome && !isAudit && !answerMode" caption="WAARDE TOEVOEGEN">
            <div v-if="!addOpen" class="flex items-center justify-between gap-3">
              <p class="text-sm text-muted">Ziet u iets in het document dat hierboven niet staat? Voeg de waarde toe; het model leert ervan.</p>
              <Button label="Waarde toevoegen" variant="secondary" @click="addOpen = true" />
            </div>
            <div v-else class="grid grid-cols-2 gap-x-3 gap-y-2">
              <Field v-model="addField" kind="select" label="Gegeven" :options="ADD_FIELD_OPTIONS" empty-label="Kies een gegeven" />
              <Field
                v-if="addValueKind === 'select'"
                v-model="addValue"
                kind="select"
                label="Waarde"
                :options="addValueOptions ?? []"
                empty-label="Kies een waarde"
              />
              <Field v-else v-model="addValue" :kind="addValueKind" label="Waarde" :hint="addField && FIELD_UNIT[addField] ? FIELD_UNIT[addField] : undefined" />
              <Field v-model="addAddress" kind="select" label="Adres" :options="addAddressOptions" empty-label="Pand van de melding" />
              <Field v-model="addNote" kind="text" label="Toelichting (optioneel)" />
              <div class="col-span-2 flex justify-end gap-2">
                <Button label="Annuleren" variant="secondary" :disabled="addBusy" @click="addOpen = false" />
                <Button label="Toevoegen" variant="primary" :disabled="addBusy || !addField || !addValue.trim()" @click="addManualValue" />
              </div>
            </div>
          </Panel>
          <Panel v-if="settled.length" caption="BEOORDEELD" :meta="String(settledCards.length)">
            <ul class="flex flex-col gap-2">
              <li
                v-for="f in settledCards"
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
                  <span v-if="refusedReason(f)" class="block text-red">
                    Geweigerd, bron niet toelaatbaar: {{ refusedReason(f) }}
                  </span>
                  <span v-else class="block text-muted">
                    {{ VERDICT_LABEL[decided[f.id]!] ?? decided[f.id] }}<template
                      v-if="decided[f.id] === 'corrected' && corrections[f.id]"
                    >
                      naar {{ labelValue(f.field, corrections[f.id]) }}</template
                    ><template v-if="membersOf(f).length > 1"> · geldt voor {{ membersOf(f).length }} adressen</template
                    ><template v-else-if="addressLine(f)"> · {{ addressLine(f) }}</template>
                  </span>
                </span>
                <Button
                  v-if="!closed && !data?.dossier.outcome && !isAudit"
                  class="ml-auto shrink-0 self-start"
                  label="Heropenen"
                  variant="secondary"
                  :disabled="busy === f.id"
                  title="Zet de waarde terug bij de open voorstellen; de eerdere beoordeling blijft in het logboek"
                  @click="reopen(f)"
                />
              </li>
            </ul>
          </Panel>

          <!-- #341: a herstel is recorded before the dossier is closed. -->
          <RecordRecoveryPanel
            v-if="showRecovery && !recoveryId && !closed && !data?.dossier.outcome"
            :dossier-id="data!.dossier.id"
            :addresses="addresses"
            :melder-hint="melderRecoveryHint"
            :suggested-date="takenDocumentValue('document_date')?.slice(0, 10) ?? null"
            @recorded="onRecoveryRecorded"
            @error="(m) => (error = m)"
          />
          <Callout v-else-if="recoveryId" tone="green" title="Herstel vastgelegd">
            Dit dossier heeft herstel
            <RouterLink :to="{ name: 'recovery-view', params: { id: recoveryId } }" class="font-semibold underline">#{{ recoveryId }}</RouterLink>
            vastgelegd.
          </Callout>
          <button
            v-else-if="data && !isAudit && !closed && !data.dossier.outcome"
            type="button"
            class="text-sm self-start text-muted underline"
            @click="askedForRecovery = true"
          >
            Dit dossier gaat over een herstel…
          </button>


          <!-- The dossier's timeline: everything that happened, in order. The
               melder's status page shows the visible subset of these same rows,
               so reviewer and melder can never see two different stories. -->
          <!-- The melding as the melder wrote it (#350): what they said, what they
               filled in, who they are. Read-only; the answers are the melder's claim. -->
          <Panel v-if="!loading && data && hasMelding" caption="MELDING">
            <div class="flex flex-col gap-2 text-md">
              <p v-if="data.dossier.payload?.topicLabel"><span class="text-sm mr-1.5 font-semibold uppercase text-label">Onderwerp</span><span class="text-muted">{{ data.dossier.payload.topicLabel }}</span></p>
              <p v-for="a in meldingAnswers" :key="a.label"><span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ a.label }}</span><span class="text-muted">{{ a.value }}</span></p>
              <p v-for="m in modelNow" :key="m.label"><span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ m.label }}</span><span class="font-semibold text-ink">{{ m.value }}</span></p>
              <p v-if="data.dossier.payload?.note" class="whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-muted">{{ data.dossier.payload.note }}</p>
              <p v-if="meldingNaw.length" class="text-sm text-faint">
                <template v-for="(n, i) in meldingNaw" :key="n.label"><span v-if="i">&nbsp;·&nbsp;</span>{{ n.label }}: <span class="text-muted">{{ n.value }}</span></template>
              </p>
            </div>
          </Panel>
          <Panel v-if="!loading && data" caption="VERLOOP" :meta="String(entries.length)">
            <ul class="flex flex-col gap-1.5">
              <li v-for="e in entries" :key="e.id" class="text-md flex gap-2.5">
                <span class="text-sm w-[84px] shrink-0 font-mono text-faint">{{ entryWhen(e.at) }}</span>
                <span class="min-w-0">
                  <span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ KIND_LABEL[e.kind] ?? e.kind }}</span>
                  <!-- #356: replies and questions as a mail card, quoted history folded. -->
                  <div v-if="mailCards[e.id]" class="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                    <div class="mb-1 flex flex-wrap items-baseline gap-x-1.5 text-faint">
                      <span class="font-semibold text-ink">{{ e.kind === 'reply' ? 'Mail van de melder' : 'Mail aan de melder' }}</span>
                      <span v-if="e.kind === 'reply' && e.actor" class="break-all">{{ e.actor }}</span>
                      <span v-else-if="e.kind === 'question' && melderEmail" class="break-all">{{ melderEmail }}</span>
                      <span v-if="mailCards[e.id].attachments">· {{ mailCards[e.id].attachments }} {{ mailCards[e.id].attachments === 1 ? 'bijlage' : 'bijlagen' }}</span>
                    </div>
                    <div v-if="mailCards[e.id].subject" class="mb-1 font-semibold text-ink">{{ mailCards[e.id].subject }}</div>
                    <div class="whitespace-pre-wrap break-words text-muted">{{ mailCards[e.id].own || '(geen eigen tekst)' }}</div>
                    <template v-if="mailCards[e.id].quoted">
                      <button type="button" class="mt-1 text-green-ink underline underline-offset-2" @click="shownQuote = { ...shownQuote, [e.id]: !shownQuote[e.id] }">
                        {{ shownQuote[e.id] ? 'verberg eerdere berichten' : 'toon eerdere berichten' }}
                      </button>
                      <div v-if="shownQuote[e.id]" class="mt-1.5 whitespace-pre-wrap break-words border-l-2 border-line pl-2.5 text-faint">{{ mailCards[e.id].quoted }}</div>
                    </template>
                  </div>
                  <span v-else class="break-words text-muted">{{ e.text }}</span>
                  <!-- Our own mail, the same words the melder got (#350). -->
                  <template v-if="mailOf(e) && !mailCards[e.id]">
                    <button type="button" class="text-sm ml-1.5 text-green-ink underline underline-offset-2" @click="shownMail = { ...shownMail, [e.id]: !shownMail[e.id] }">
                      {{ shownMail[e.id] ? 'verberg mail' : 'toon mail' }}
                    </button>
                    <div v-if="shownMail[e.id]" class="mt-1.5 whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
                      <div class="mb-1 font-semibold text-ink">{{ mailOf(e)?.subject }}</div>{{ mailOf(e)?.text }}
                    </div>
                  </template>
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
              <!-- Clears the dossier from "Reactie ontvangen" when the answer
                   was given by phone or from a private mailbox (Don, 2026-09-19). -->
              <Button
                v-if="melderRepliedLast"
                label="Reactie afgehandeld"
                :disabled="remarkBusy"
                title="Zet een notitie op het dossier, zodat het uit Reactie ontvangen verdwijnt"
                @click="markReplyHandled"
              />
            </div>
            <!-- Only when there is somebody to mail: bulk drops carry no melder,
                 and a permanently grey box on 99% of the queue is noise. -->
            <!-- Also after closure: the melder writes back after the afronding and
                 the answer must come from here, without reopening (Don, 2026-09-15). -->
            <!-- A textarea since 2026-09-23 (Don): the text is the body of a
                 mail, and one line made every reply a single paragraph. Enter
                 is a new line; Ctrl/⌘+Enter sends, as in a mail client. The
                 API already turns line breaks into <br> in the HTML mail. -->
            <div v-if="melderEmail" class="mt-2 flex items-end gap-2">
              <textarea
                v-model="questionText"
                rows="3"
                class="studio-control flex-1 resize-y rounded-md border border-line bg-sunken px-2 py-1.5"
                :placeholder="`${data?.dossier.outcome ? 'Reactie' : 'Vraag'} aan de melder (gemaild naar ${melderEmail}). Ctrl+Enter verstuurt.`"
                aria-label="Vraag aan de melder"
                @keydown.enter.ctrl.prevent="askQuestion"
                @keydown.enter.meta.prevent="askQuestion"
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
          <Panel :caption="answerMode ? 'BEANTWOORDEN' : 'DOSSIER SLUITEN'">
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
                <div class="flex flex-col gap-1">
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
                  <!-- #194: the cover named a bureau we do not have. Only a
                       verifier or superuser may grow the shared list. -->
                  <Button
                    v-if="canAddContractor"
                    variant="secondary"
                    class="self-start"
                    :label="addingContractor ? 'Bezig…' : `“${contractorUnmatched}” toevoegen`"
                    :disabled="addingContractor"
                    title="Voegt de opsteller toe aan de lijst en selecteert hem voor dit dossier"
                    @click="addContractor"
                  />
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  :label="isAudit ? (taken.length ? 'Wijzigingen doorvoeren' : 'Afronden zonder wijzigingen') : taken.length ? 'Overnemen als rapportage' : 'Rapportage aanmaken, handmatig invullen'"
                  :disabled="committing || closing || open.length > 0 || !wasRead || commitDateMissing"
                  :title="open.length > 0 ? 'Beoordeel eerst alle voorstellen' : !wasRead ? 'Wacht tot het document gelezen is' : commitDateMissing ? 'Vul eerst Datum rapport in' : ''"
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
                v-model="closeTemplate"
                kind="select"
                label="Standaardantwoord"
                :options="CLOSE_TEMPLATE_OPTIONS"
                empty-label="Geen, zelf schrijven"
                :hint="closeTemplateHint"
              />
              <Field
                id="review-close-note"
                v-model="closeNote"
                kind="textarea"
                :rows="answerMode ? 5 : 3"
                label="Reden"
                :error="noteError"
                hint="Gaat als tekst in de mail aan de melder. Verplicht bij afwijzen, duplicaat en sluiten zonder rapportage."
              />
            </div>
          </Panel>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
