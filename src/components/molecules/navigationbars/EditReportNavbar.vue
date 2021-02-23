<template>
<div class="container">
      <div class="row">
        <div class="col-6 text-right">
          <BackButton :to="previousStep" label="Vorige" />
        </div>
        <div class="col-6 text-left">
          <PrimaryArrowButton :to="nextStep" :label="`${ $route.name === 'edit-report-3' ? 'Aanbieden ter review' : 'Volgende'}`" />
        </div>
      </div>
    </div>
</template>

<script>
import PrimaryArrowButton from "atom/navigation/PrimaryArrowButton";
import BackButton from "atom/navigation/BackButton";

import { mapGetters } from 'vuex'
import { icon } from 'helper/assets'
import { EventBus } from 'utils/eventBus.js'

export default {
  name: "EditReportHeader",
  components: {
    PrimaryArrowButton,
    BackButton
  },
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ]),
    headerClasses() {
      switch(this.$route.name) {
        case "new-report":
          return ["--active", "", ""];
        case "edit-report-1":
          return ["--active", "", ""];
        case "edit-report-2":
          return ["--completed", "--active", ""];
        case "edit-report-3":
          return ["--completed", "--completed", "--active"];
        default:
          return ["", "", ""]
      }
    },
    previousStep() {
      const params = this.$route.params;
      let name = this.$route.name;

      switch(name) {
        case "new-report":
          return {
            name: "dashboard"
          }
        case "edit-report-1":
          return {
            name: "dashboard"
          }
        case "edit-report-2":
          return {
            name: "edit-report-1",
            params
          }
        case "edit-report-3":
          return {
            name: "edit-report-2",
            params
          }
        default:
          return {
            name: "dashboard"
          }
      }
    },
    nextStep() {
      const params = this.$route.params;
      let name = this.$route.name;

      switch(name) {
        case "new-report":
          return {
            name: "edit-report-2",
            params
          }
        case "edit-report-1":
          return {
            name: "edit-report-2",
            params
          }
        case "edit-report-2":
          return {
            name: "edit-report-3",
            params
          }
        case "edit-report-3":
          return {
            name: "view-report",
            params
          }
        default:
          return {
            name: "dashboard"
          }
      }
    }
  },
  methods: {
    icon,
    handleSaveReport() {
      EventBus.$emit('save-report')
    }
  },

}
</script>
