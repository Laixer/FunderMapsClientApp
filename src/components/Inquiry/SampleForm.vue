<script setup lang="ts">
import { ref, watch } from 'vue'
import cloneDeep from 'lodash-es/cloneDeep'

import Card from '@/components/Common/Card.vue'
import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'

import type {
  IInquirySample,
  IInquirySampleInput,
} from '@/services/fundermaps/interfaces/IInquirySample'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'
import {
  SUBSTRUCTURE_OPTIONS,
  FOUNDATION_TYPE_OPTIONS,
  ENFORCEMENT_TERM_OPTIONS,
  FOUNDATION_DAMAGE_CAUSE_OPTIONS,
  DAMAGE_CHARACTERISTICS_OPTIONS,
  FOUNDATION_QUALITY_OPTIONS,
  QUALITY_OPTIONS,
  WOOD_TYPE_OPTIONS,
  WOOD_ENCROACHMENT_OPTIONS,
  CRACK_TYPE_OPTIONS,
  ROTATION_OPTIONS,
  FACADE_SCAN_RISK_OPTIONS,
  CONSTRUCTION_PILE_OPTIONS,
} from '@/services/sampleEnums'

const props = defineProps<{
  sample: IInquirySample
  saving?: boolean
}>()

const addressStore = useAddressStore()

const emit = defineEmits<{
  save: [data: IInquirySampleInput]
  delete: []
}>()

/** Editable copy. Reset whenever the parent passes a new sample. */
const form = ref<IInquirySample>(cloneDeep(props.sample))

watch(
  () => props.sample.id,
  () => {
    form.value = cloneDeep(props.sample)
  },
)

function onSave() {
  const { id, inquiry, building, createDate, updateDate, deleteDate, ...input } = form.value
  void id
  void inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  emit('save', input as IInquirySampleInput)
}
</script>

<template>
  <Card class="List">
    <header
      class="-mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="heading-3 wrap-break-word">
          {{ formatAddress(addressStore.cache[form.address]) }}
        </h3>
        <p v-if="form.building" class="text-xs text-grey-700">Pand: {{ form.building }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button label="Verwijderen" danger @click="emit('delete')" />
        <Button label="Opslaan" type="submit" :disabled="saving" @click="onSave" />
      </div>
    </header>

    <div class="space-y-8">
      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Algemeen
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input v-model="form.builtYear" label="Bouwjaar" type="date" />
          <Select
            v-model="form.substructure"
            label="Onderbouw"
            :options="SUBSTRUCTURE_OPTIONS"
            placeholder="-"
          />
          <Input v-model="form.cpt" label="Sondering" />
          <Input v-model="form.monitoringWell" label="Peilbuis" />
          <Input
            v-model.number="form.groundLevel"
            label="Maaiveldhoogte (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.groundwaterLevelTemp"
            label="Grondwaterstand tijdens inspectie (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.groundwaterLevelNet"
            label="Grondwaterstand (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <CheckBox v-model="form.recoveryAdvised" label="Hersteladvies / funderingsherstel noodzakelijk" />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Fundering
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            v-model="form.foundationType"
            label="Funderingstype"
            :options="FOUNDATION_TYPE_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.enforcementTerm"
            label="Handhavingstermijn"
            :options="ENFORCEMENT_TERM_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.damageCause"
            label="Schade-oorzaak"
            :options="FOUNDATION_DAMAGE_CAUSE_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.damageCharacteristics"
            label="Waargenomen schadebeeld"
            :options="DAMAGE_CHARACTERISTICS_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.constructionPile"
            label="Type funderingsbalk"
            :options="CONSTRUCTION_PILE_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.woodType"
            label="Houtsoort paal"
            :options="WOOD_TYPE_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.woodEncroachment"
            label="Type houtaantasting"
            :options="WOOD_ENCROACHMENT_OPTIONS"
            placeholder="-"
          />
          <Input
            v-model.number="form.constructionLevel"
            label="Onderkant fundering (m NAP), alleen bij niet-onderheide fundering"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.woodLevel"
            label="Bovenkant funderingshout (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.foundationDepth"
            label="Diepteligging funderingshout"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Input
            v-model.number="form.masonLevel"
            label="Onderkant metselwerk (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.pileDiameterTop"
            label="Paaldiameter top"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Input
            v-model.number="form.pileDiameterBottom"
            label="Paaldiameter onder"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Input
            v-model.number="form.pileHeadLevel"
            label="Paalkop niveau"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.pileTipLevel"
            label="Paalpunt niveau"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.concreteChargerLength"
            label="Lengte betonoplanger (m)"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Input
            v-model.number="form.pileDistanceLength"
            label="Paalafstand"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Input
            v-model.number="form.woodPenetrationDepth"
            label="Indringingswaarde (mm)"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Kwaliteit
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            v-model="form.overallQuality"
            label="Algehele funderingskwaliteit"
            :options="FOUNDATION_QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.woodQuality"
            label="Kwaliteit hout"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.constructionQuality"
            label="Stabiliteit funderingsconstructie"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.woodCapacityHorizontalQuality"
            label="Draagkracht horizontaal funderingshout"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.pileWoodCapacityVerticalQuality"
            label="Draagkracht paalhout"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.carryingCapacityQuality"
            label="Geotechnische draagkracht"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <Select
            v-model="form.masonQuality"
            label="Metselwerkkwaliteit"
            :options="QUALITY_OPTIONS"
            placeholder="-"
          />
          <CheckBox v-model="form.woodQualityNecessity" label="Houtonderzoek nodig" />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Scheuren
        </h4>
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              v-model="form.crackIndoorType"
              label="Inpandige scheur"
              :options="CRACK_TYPE_OPTIONS"
              placeholder="-"
            />
            <Input v-model.number="form.crackIndoorSize" label="Grootte (mm)" type="number" />
            <CheckBox v-model="form.crackIndoorRestored" label="Hersteld" />
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              v-model="form.crackFacadeFrontType"
              label="Voorgevel scheur"
              :options="CRACK_TYPE_OPTIONS"
              placeholder="-"
            />
            <Input v-model.number="form.crackFacadeFrontSize" label="Grootte (mm)" type="number" />
            <CheckBox v-model="form.crackFacadeFrontRestored" label="Hersteld" />
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              v-model="form.crackFacadeBackType"
              label="Achtergevel scheur"
              :options="CRACK_TYPE_OPTIONS"
              placeholder="-"
            />
            <Input v-model.number="form.crackFacadeBackSize" label="Grootte (mm)" type="number" />
            <CheckBox v-model="form.crackFacadeBackRestored" label="Hersteld" />
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              v-model="form.crackFacadeLeftType"
              label="Linkergevel scheur"
              :options="CRACK_TYPE_OPTIONS"
              placeholder="-"
            />
            <Input v-model.number="form.crackFacadeLeftSize" label="Grootte (mm)" type="number" />
            <CheckBox v-model="form.crackFacadeLeftRestored" label="Hersteld" />
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              v-model="form.crackFacadeRightType"
              label="Rechtergevel scheur"
              :options="CRACK_TYPE_OPTIONS"
              placeholder="-"
            />
            <Input v-model.number="form.crackFacadeRightSize" label="Grootte (mm)" type="number" />
            <CheckBox v-model="form.crackFacadeRightRestored" label="Hersteld" />
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Vervorming
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CheckBox v-model="form.deformedFacade" label="Gevelvervorming aanwezig" />
          <CheckBox v-model="form.thresholdUpdownSkewed" label="Scheefstand onder-/bovendorpel aanwezig" />
          <Input
            v-model.number="form.thresholdFrontLevel"
            label="Drempelniveau voorzijde (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.thresholdBackLevel"
            label="Drempelniveau achterzijde (m NAP)"
            type="number"
            step="0.01"
            :min="-999.99"
            :max="999.99"
          />
          <Input
            v-model.number="form.skewedParallel"
            label="Lintvoegmeting (mm/m)"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Select
            v-model="form.skewedParallelFacade"
            label="Lintvoegmeting beoordeling"
            :options="ROTATION_OPTIONS"
            placeholder="-"
          />
          <Input
            v-model.number="form.skewedPerpendicular"
            label="Loodmeting (mm/m)"
            type="number"
            step="0.01"
            :min="0"
            :max="999.99"
          />
          <Select
            v-model="form.skewedPerpendicularFacade"
            label="Loodmeting beoordeling"
            :options="ROTATION_OPTIONS"
            placeholder="-"
          />
          <Input
            v-model.number="form.settlementSpeed"
            label="Zakkingssnelheid (mm/jaar)"
            type="number"
            step="0.01"
          />
          <CheckBox v-model="form.skewedWindowFrame" label="Scheve kozijnen" />
          <Select
            v-model="form.facadeScanRisk"
            label="Risicoklasse QuickScan / Fase 0"
            :options="FACADE_SCAN_RISK_OPTIONS"
            placeholder="-"
          />
        </div>
      </section>

      <section>
        <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
          Notitie
        </h4>
        <Textarea v-model="form.note" placeholder="Optionele notitie…" :rows="4" />
      </section>
    </div>
  </Card>
</template>
