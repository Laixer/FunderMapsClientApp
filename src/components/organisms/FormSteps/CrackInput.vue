<template>
  <div class="">
    <div class="form-row">
      <div class="col-3">
        <FormField
          v-model="fields.crackIndoorSizeCheck.value"
          v-bind="fields.crackIndoorSizeCheck"
        />
      </div>

      <div class="col-9">
        <template v-if="fields.crackIndoorSizeCheck.value">
          <div class="form-row">
            <FormField
              v-model="fields.crackIndoorSizeAmount.value"
              v-bind="fields.crackIndoorSizeAmount"
              class="col-5"
            />
            <FormField
              v-model="fields.crackIndoorRestored.value"
              v-bind="fields.crackIndoorRestored"
              class="col-7"
            />
          </div>
          <div class="form-row cracks-wrapper">
            <FormField
              v-for="index in fields.crackIndoorSizeAmount.value"
              :key="index"
              :label="`Scheur ${index}`"
              v-model="fields.crackIndoorSize.value[index - 1]"
              v-bind="fields.crackIndoorSize"
            />
          </div>
        </template>
      </div>
    </div>
    <hr />
  </div>
</template>

<script>
import FormField from "molecule/form/FormField";

export default {
  name: "CrackInput",
  props: {
    steps: {
      type: Number,
      default: 2,
    },
  },
  components: {
    FormField,
  },
  computed: {
    progress() {
      return {
        width: (this.step / this.steps) * 100 + "%",
      };
    },
  },
};
</script>

<style lang="scss">
.ProgressLine {
  position: absolute;
  height: 6px;
  background: #ced0da;
  width: calc(100% - 100px);
  left: 50px;
  top: 47px;

  &__progress {
    position: absolute;
    background: #17a4ea;
    height: 100%;
    top: 0;
    left: 0;
  }
}
</style>
