<template>
  <div class="SampleDetail" :class="{ 'SampleDetail--active': open }">
    <div class="SampleDetail__dropdown" @click="open = !open">
      <h5 class="SampleDetail__title">{{ sample.addressFormatted }}</h5>

      <span class="SampleDetail__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </div>

    <div class="SampleDetail__overview" v-if="open">
      <OverviewItem
        v-for="(group, index) in sampleData"
        :key="index"
        :group="group"
      />
      <div v-if="!readOnly" class="SampleDetail__change">
        <router-link
          :to="{
            name: 'edit-report-2',
            params: { sampleId: sample.id, step: 1 },
          }"
          class="btn btn-submit"
          >Bewerken</router-link
        >
      </div>
    </div>
  </div>
</template>

<script>
import { icon } from "helper/assets";
import OverviewItem from "organism/OverviewItem";
import SampleModel from "../../models/Sample";

export default {
  name: "SampleDetail",
  props: {
    sample: {
      type: SampleModel,
      required: true,
    },
    readOnly: {
      required: false,
      default: true,
    },
  },
  components: {
    OverviewItem,
  },

  data() {
    return {
      icon,
      open: false,
      data: {},
    };
  },

  computed: {
    sampleData() {
      return [
        {
          title: "Algemeen",
          col: 6,
          columns: [
            [
              {
                label: "Adres",
                value: this.sample.addressFormatted,
              },
              {
                label: "Onderbouw",
                value: this.sample.getSubstructure(),
              },
            ],
            [
              {
                label: "Bouwjaar",
                value: this.sample.builtYear
                  ? new Date(this.sample.builtYear).getFullYear()
                  : null,
              },
              {
                label: "Funderingsherstel advies",
                value: this.sample.recoveryAdvised,
              },
            ],
          ],
        },
        {
          title: "Omgeving",
          col: 6,
          columns: [
            [
              {
                label: "Sondering",
                value: this.sample.cpt,
              },
              {
                label: "Maaiveldniveau",
                value: this.sample.groundLevel,
              },
              {
                label: "Grondwaterniveau",
                value: this.sample.groundwaterLevelTemp,
              },
            ],
            [
              {
                label: "Peilbuis",
                value: this.sample.monitoringWell,
              },
              {
                label: "Grondwaterniveau bij ontgraving",
                value: this.sample.groundwaterLevelNet,
              },
            ],
          ],
        },
        {
          title: "Fundering",
          col: 6,
          columns: [
            [
              {
                label: null,
                value: this.sample.getFoundationTypeImage(),
                type: "image",
                classes: "half-width",
              },
            ],
            [
              {
                label: "Handhavingstermijn",
                value: this.sample.getEnforcementTerm(),
              },
              {
                label: "Geconstateerde schade",
                value: this.sample.getdamageCharacteristics(),
              },
              {
                label: "Algehele funderingskwaliteit",
                value: this.sample.getOverallQuality(),
              },
              {
                label: "Oorzaak funderingsschade",
                value: this.sample.getFoundationDamageCause(),
              },
            ],
          ],
        },
        {
          title: "Palen & hout",
          col: 6,
          columns: [
            [
              {
                label: "Paalkop niveau",
                value: this.sample.pileHeadLevel,
              },
              {
                label: "Paalkop diameter",
                value: this.sample.pileDiameterTop,
              },
              {
                label: "Hart-op-hart afstand",
                value: this.sample.pileDistanceLength,
              },
            ],
            [
              {
                label: "Paalpunt niveau",
                value: this.sample.pileTipLevel,
              },
              {
                label: "Paalpunt diameter",
                value: this.sample.pileDiameterBottom,
              },
              {
                label: "Oplanger lengte",
                value: this.sample.concreteChargerLength,
              },
            ],
          ],
        },
        {
          title: null,
          col: 6,
          columns: [
            [
              {
                label: "Houtsoort",
                value: this.sample.getWoodType(),
              },
              {
                label: "Inslagdiepte",
                value: this.sample.woodPenetrationDepth,
              },
              {
                label: "Houtkwaliteit paal",
                value: this.sample.getWoodQuality(),
              },
              {
                label: "Resterende draagkracht paal",
                value: this.sample.getPileWoodCapacityVerticalQuality(),
              },
            ],
            [
              {
                label: "Houtonderzoek",
                value: this.sample.woodQualityNecessity,
              },
              {
                label: "Houtaantasting",
                value: this.sample.getWoodEncroachement(),
              },
              {
                label: "Kwaliteit draagkracht paal",
                value: this.sample.getcarryingCapacityQuality(),
              },
              {
                label: "Horizontale draagkracht paal",
                value: this.sample.getWoodCapacityHorizontalQuality(),
              },
            ],
          ],
        },
        {
          title: "Niveaus & kwaliteit",
          col: 6,
          columns: [
            [
              {
                label: "Kwaliteit metselwerk",
                value: this.sample.getMasonQuality(),
              },
              {
                label: "Funderingsbalk",
                value: this.sample.woodLevel ? "Hout" : this.sample.constructionLevel ? "Beton" : null,
              },
              {
                label: "Niveau onderkant funderingsbalk",
                value: this.sample.woodLevel
                  ? this.sample.woodLevel
                  : this.sample.constructionLevel,
              },
            ],
            [
              {
                label: "Niveau onderkant metselwerk",
                value: this.sample.masonLevel,
              },
              {
                label: "Kwaliteit funderingsbalk",
                value: this.sample.getConstructionQuality(),
              },
            ],
          ],
        },
        {
          title: "Scheuren",
          col: 3,
          show: this.sample.crackIndoorRestored !== null || this.sample.getCrackIndoorType() !==null || this.sample.crackIndoorSize !== null,
          columns: [
            [
              {
                label: null,
                value: {
                  text: "Inpandige scheur",
                  icon: "crack-indoor.svg",
                },
                type: "image",
              },
            ],
            [
              {
                label: "Hersteld",
                value: this.sample.crackIndoorRestored,
              },
              {
                label: "Type",
                value: this.sample.getCrackIndoorType(),
              },
            ],
            [
              // {
              //   label: "Hoeveel scheuren",
              //   value: 1,
              //   classes: "spacing",
              // },
              {
                label: "Scheur (mm)",
                value: this.sample.crackIndoorSize,
              },
            ],
          ],
        },
        {
          title: null,
          col: 3,
          show: this.sample.crackFacadeFrontRestored !== null || this.sample.getCrackFacadeFrontType() !== null || this.sample.crackFacadeFrontSize !== null,
          columns: [
            [
              {
                label: null,
                value: {
                  text: "Voorgevel scheur",
                  icon: "crack-facade-front.svg",
                },
                type: "image",
              },
            ],
            [
              {
                label: "Hersteld",
                value: this.sample.crackFacadeFrontRestored,
              },
              {
                label: "Type",
                value: this.sample.getCrackFacadeFrontType(),
              },
            ],
            [
              // {
              //   label: "Hoeveel scheuren",
              //   value: 1,
              //   classes: "spacing",
              // },
              {
                label: "Scheur (mm)",
                value: this.sample.crackFacadeFrontSize,
              },
            ],
          ],
        },
        {
          title: null,
          col: 3,
          show: this.sample.crackFacadeBackRestored !== null || this.sample.getCrackFacadeBackType() !== null || this.sample.crackFacadeBackSize !== null,
          columns: [
            [
              {
                label: null,
                value: {
                  text: "Achtergevel scheur",
                  icon: "crack-facade-back.svg",
                },
                type: "image",
              },
            ],
            [
              {
                label: "Hersteld",
                value: this.sample.crackFacadeBackRestored,
              },
              {
                label: "Type",
                value: this.sample.getCrackFacadeBackType(),
              },
            ],
            [
              // {
              //   label: "Hoeveel scheuren",
              //   value: 1,
              //   classes: "spacing",
              // },
              {
                label: "Scheur (mm)",
                value: this.sample.crackFacadeBackSize,
              },
            ],
          ],
        },
        {
          title: null,
          col: 3,
          show: this.sample.crackFacadeLeftRestored !== null || this.sample.getCrackFacadeLeftType() !== null || this.sample.crackFacadeLeftSize !== null,
          columns: [
            [
              {
                label: null,
                value: {
                  text: "Linkergevel scheur",
                  icon: "crack-facade-left.svg",
                },
                type: "image",
              },
            ],
            [
              {
                label: "Hersteld",
                value: this.sample.crackFacadeLeftRestored,
              },
              {
                label: "Type",
                value: this.sample.getCrackFacadeLeftType(),
              },
            ],
            [
              // {
              //   label: "Hoeveel scheuren",
              //   value: 1,
              //   classes: "spacing",
              // },
              {
                label: "Scheur (mm)",
                value: this.sample.crackFacadeLeftSize,
              },
            ],
          ],
        },
        {
          title: null,
          col: 3,
          show: this.sample.crackFacadeRightRestored !== null || this.sample.getCrackFacadeRightType() !== null || this.sample.crackFacadeRightSize !== null,
          columns: [
            [
              {
                label: null,
                value: {
                  text: "Rechtergevel scheur",
                  icon: "crack-facade-right.svg",
                },
                type: "image",
              },
            ],
            [
              {
                label: "Hersteld",
                value: this.sample.crackFacadeRightRestored,
              },
              {
                label: "Type",
                value: this.sample.getCrackFacadeRightType(),
              },
            ],
            [
              // {
              //   label: "Hoeveel scheuren",
              //   value: 1,
              //   classes: "spacing",
              // },
              {
                label: "Scheur (mm)",
                value: this.sample.crackFacadeRightSize,
              },
            ],
          ],
        },
        {
          title: "Vervorming",
          col: 6,
          columns: [
            [
              {
                label: "Gevel vervormd",
                value: this.sample.deformedFacade,
              },
              {
                label: "Lintvoegmeting beoordeling",
                value: this.sample.getSkewedParallelFacade(),
              },
              {
                label: "Lintvoegmeting",
                value: this.sample.skewedParallel,
              },
              {
                label: "Drempel voorgevel niveau",
                value: this.sample.thresholdFrontLevel,
              },
              {
                label: "Scheve deur- en/of raamkozijn",
                value: this.sample.skewedWindowFrame,
              },
            ],
            [
              {
                label: "Scheefstand",
                value: this.sample.skewedFacade,
              },
              {
                label: "Loodmeting beoordeling",
                value: this.sample.getSkewedPerpendicularFacade(),
              },
              {
                label: "Loodmeting",
                value: this.sample.skewedPerpendicular,
              },
              {
                label: "Drempel achtergevel niveau",
                value: this.sample.thresholdBackLevel,
              },
              {
                label: "Pandzakkingssnelheid",
                value: this.sample.settlementSpeed,
              },
            ],
          ],
        },
      ];
    },
  },

  methods: {},
};
</script>
