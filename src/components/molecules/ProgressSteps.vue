<template>
  <div class="ProgressWrapper">
    <div class="container">
      <div class="row">
        <div class="col-lg-10 offset-lg-1">
          <div class="ProgressSteps">
            <!-- <ProgressLine :steps="steps.length - 1" :step="step" /> -->
            <ProgressIndicator
              v-for="(step, index) in steps"
              :key="index"
              :status="step.status"
              :iconName="step.iconName"
              :title="step.title"
              :clickable="step.clickable"
              :step="step.step"
              :last="index == steps.length - 1"
              :to="step.to"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProgressIndicator from "atom/ProgressIndicator";
import ProgressLine from "atom/ProgressLine";

export default {
  name: "ProgressSteps",
  components: {
    ProgressIndicator,
    // ProgressLine,
  },
  props: {
    steps: {
      type: Array,
      default: function() {
        return [];
      },
    },
  },
  computed: {
    step() {
      console.log(this.steps);
      return this.steps.findIndex(step => {
        return step.status === "active";
      });
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";

.ProgressWrapper {
  border-top: 1px solid $mischka;
  border-bottom: 1px solid $mischka;
  background-color: $white;
}

.ProgressSteps {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  margin: 0;
}
</style>
