<template>
  <div>
    <DataRow
      v-for="(row, index) in sampleData"
      :key="index"
      :items="row"
      :divider="index !== (sampleData.length - 1)"
    />
  </div>
</template>

<script>
import DataRow from "molecule/DataRow";
import SampleModel from "../../models/Sample";

export default {
  name: "SampleDataPresentation",
  components: {
    DataRow
  },
  props: {
    sample: {
      type: SampleModel,
      required: true
    }
  },
  computed: {
    sampleData() {
      return [
        [
          {
            label: "Funderingstype",
            value: this.sample.getFoundationType()
          },
          {
            label: "Onderbouw",
            value: this.sample.getSubstructure()
          },
          {
            label: "Bouwjaar",
            value: this.sample.builtYear
          }
        ],
        [
          {
            label: "Peilbuis",
            value: this.sample.monitoringWell
          },
          {
            label: "Sondering",
            value: this.sample.cpt
          }
        ],
        [
          {
            label: "Funderingskwaliteit",
            value: this.sample.getFoundationQuality()
          },
          {
            label: "Funderingsherstel advies",
            value: this.sample.foundationRecoveryAdviced
          }
        ],
        [
          {
            label: "Oorzaak funderingsschade",
            value: this.sample.getFoundationDamageCause()
          },
          {
            label: "Handhavingstermijn",
            value: this.sample.getEnforcementTerm()
          }
        ],
        [
          {
            label: "Referentiestelsel",
            value: this.sample.getBaseMeasurementLevel()
          },
          {
            label: "Hoogte Langshout",
            value: this.sample.woodLevel
          }
        ],
        [
          {
            label: "Grondwaterstand",
            value: this.sample.groundwaterLevel
          },
          {
            label: "Maaiveldhoogte",
            value: this.sample.groundLevel
          }
        ]
      ];
    }
  }
};
</script>
