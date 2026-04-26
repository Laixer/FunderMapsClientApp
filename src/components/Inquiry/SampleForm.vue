<script setup lang="ts">
import { ref, watch } from 'vue'
import cloneDeep from 'lodash-es/cloneDeep'

import Card from '@/components/Common/Card.vue'
import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'

import type { IInquirySample, IInquirySampleInput } from '@/services/fundermaps/interfaces/IInquirySample'
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
  void id; void inquiry; void building; void createDate; void updateDate; void deleteDate
  emit('save', input as IInquirySampleInput)
}
</script>

<template>
  <div class="space-y-6">
    <Card title="Adres">
      <p class="text-sm text-grey-800">{{ form.address }}</p>
      <p v-if="form.building" class="text-xs text-grey-700">Pand: {{ form.building }}</p>
    </Card>

    <Card title="Algemeen">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input v-model="form.builtYear" label="Bouwjaar" type="date" />
        <Select v-model="form.substructure" label="Onderbouw" :options="SUBSTRUCTURE_OPTIONS" placeholder="-" />
        <Input v-model="form.cpt" label="Sondering" />
        <Input v-model="form.monitoringWell" label="Peilbuis" />
        <Input v-model.number="form.groundLevel" label="Maaiveld (m NAP)" type="number" step="0.01" />
        <Input v-model.number="form.groundwaterLevelTemp" label="Tijdelijk grondwater (m NAP)" type="number" step="0.01" />
        <Input v-model.number="form.groundwaterLevelNet" label="Netto grondwater (m NAP)" type="number" step="0.01" />
        <CheckBox v-model="form.recoveryAdvised" label="Herstel geadviseerd" />
      </div>
    </Card>

    <Card title="Fundering">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select v-model="form.foundationType" label="Funderingstype" :options="FOUNDATION_TYPE_OPTIONS" placeholder="-" />
        <Select v-model="form.enforcementTerm" label="Handhavingstermijn" :options="ENFORCEMENT_TERM_OPTIONS" placeholder="-" />
        <Select v-model="form.damageCause" label="Schade-oorzaak" :options="FOUNDATION_DAMAGE_CAUSE_OPTIONS" placeholder="-" />
        <Select v-model="form.damageCharacteristics" label="Schadebeeld" :options="DAMAGE_CHARACTERISTICS_OPTIONS" placeholder="-" />
        <Select v-model="form.constructionPile" label="Paaltype" :options="CONSTRUCTION_PILE_OPTIONS" placeholder="-" />
        <Select v-model="form.woodType" label="Houtsoort" :options="WOOD_TYPE_OPTIONS" placeholder="-" />
        <Select v-model="form.woodEncroachment" label="Houtaantasting" :options="WOOD_ENCROACHMENT_OPTIONS" placeholder="-" />
        <Input v-model.number="form.constructionLevel" label="Funderingsniveau" type="number" step="0.01" />
        <Input v-model.number="form.woodLevel" label="Houtniveau" type="number" step="0.01" />
        <Input v-model.number="form.foundationDepth" label="Funderingsdiepte" type="number" step="0.01" />
        <Input v-model.number="form.masonLevel" label="Metselwerkniveau" type="number" step="0.01" />
        <Input v-model.number="form.pileDiameterTop" label="Paaldiameter top" type="number" step="0.01" />
        <Input v-model.number="form.pileDiameterBottom" label="Paaldiameter onder" type="number" step="0.01" />
        <Input v-model.number="form.pileHeadLevel" label="Paalkop niveau" type="number" step="0.01" />
        <Input v-model.number="form.pileTipLevel" label="Paalpunt niveau" type="number" step="0.01" />
        <Input v-model.number="form.concreteChargerLength" label="Betonopzetter lengte" type="number" step="0.01" />
        <Input v-model.number="form.pileDistanceLength" label="Paalafstand" type="number" step="0.01" />
        <Input v-model.number="form.woodPenetrationDepth" label="Houtindringing" type="number" step="0.01" />
      </div>
    </Card>

    <Card title="Kwaliteit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select v-model="form.overallQuality" label="Algehele kwaliteit" :options="FOUNDATION_QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.woodQuality" label="Houtkwaliteit" :options="QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.constructionQuality" label="Constructiekwaliteit" :options="QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.woodCapacityHorizontalQuality" label="Houtcapaciteit horizontaal" :options="QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.pileWoodCapacityVerticalQuality" label="Paal-/houtcapaciteit verticaal" :options="QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.carryingCapacityQuality" label="Draagkracht" :options="QUALITY_OPTIONS" placeholder="-" />
        <Select v-model="form.masonQuality" label="Metselwerkkwaliteit" :options="QUALITY_OPTIONS" placeholder="-" />
        <CheckBox v-model="form.woodQualityNecessity" label="Houtkwaliteitsonderzoek nodig" />
      </div>
    </Card>

    <Card title="Scheuren">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select v-model="form.crackIndoorType" label="Inpandige scheur" :options="CRACK_TYPE_OPTIONS" placeholder="-" />
          <Input v-model.number="form.crackIndoorSize" label="Grootte (mm)" type="number" />
          <CheckBox v-model="form.crackIndoorRestored" label="Hersteld" />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select v-model="form.crackFacadeFrontType" label="Voorgevel scheur" :options="CRACK_TYPE_OPTIONS" placeholder="-" />
          <Input v-model.number="form.crackFacadeFrontSize" label="Grootte (mm)" type="number" />
          <CheckBox v-model="form.crackFacadeFrontRestored" label="Hersteld" />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select v-model="form.crackFacadeBackType" label="Achtergevel scheur" :options="CRACK_TYPE_OPTIONS" placeholder="-" />
          <Input v-model.number="form.crackFacadeBackSize" label="Grootte (mm)" type="number" />
          <CheckBox v-model="form.crackFacadeBackRestored" label="Hersteld" />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select v-model="form.crackFacadeLeftType" label="Linkergevel scheur" :options="CRACK_TYPE_OPTIONS" placeholder="-" />
          <Input v-model.number="form.crackFacadeLeftSize" label="Grootte (mm)" type="number" />
          <CheckBox v-model="form.crackFacadeLeftRestored" label="Hersteld" />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select v-model="form.crackFacadeRightType" label="Rechtergevel scheur" :options="CRACK_TYPE_OPTIONS" placeholder="-" />
          <Input v-model.number="form.crackFacadeRightSize" label="Grootte (mm)" type="number" />
          <CheckBox v-model="form.crackFacadeRightRestored" label="Hersteld" />
        </div>
      </div>
    </Card>

    <Card title="Vervorming">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CheckBox v-model="form.deformedFacade" label="Vervormde gevel" />
        <CheckBox v-model="form.thresholdUpdownSkewed" label="Drempel scheef" />
        <Input v-model.number="form.thresholdFrontLevel" label="Voorste drempelniveau" type="number" step="0.01" />
        <Input v-model.number="form.thresholdBackLevel" label="Achterste drempelniveau" type="number" step="0.01" />
        <Input v-model.number="form.skewedParallel" label="Scheefstand parallel" type="number" step="0.01" />
        <Select v-model="form.skewedParallelFacade" label="Parallelle gevel rotatie" :options="ROTATION_OPTIONS" placeholder="-" />
        <Input v-model.number="form.skewedPerpendicular" label="Scheefstand loodrecht" type="number" step="0.01" />
        <Select v-model="form.skewedPerpendicularFacade" label="Loodrechte gevel rotatie" :options="ROTATION_OPTIONS" placeholder="-" />
        <Input v-model.number="form.settlementSpeed" label="Zakkingssnelheid" type="number" step="0.01" />
        <CheckBox v-model="form.skewedWindowFrame" label="Scheve kozijnen" />
        <Select v-model="form.facadeScanRisk" label="Gevelscan risico" :options="FACADE_SCAN_RISK_OPTIONS" placeholder="-" />
      </div>
    </Card>

    <Card title="Notitie">
      <Textarea v-model="form.note" placeholder="Optionele notitie…" :rows="4" />
    </Card>

    <div class="flex justify-between gap-3">
      <Button label="Verwijderen" danger @click="emit('delete')" />
      <Button label="Opslaan" type="submit" :disabled="saving" @click="onSave" />
    </div>
  </div>
</template>
