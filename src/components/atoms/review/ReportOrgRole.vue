<template>
  <div v-if="orgObject" class="ReportOrgRole d-flex align-items-center mt-4">
    <img
      :src="orgObject.getAvatar()"
      width="32"
      height="32"
      class="rounded-circle"
    />
    <div class="ml-3">
      <div class="ReportOrgRole__name">{{ orgObject.name }}</div>
      <div class="ReportOrgRole__role">{{ orgObject.role }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import AttributedOrganisation from "../../../models/AttributedOrganisation";

export default {
  props: {
    org: {
      type: AttributedOrganisation,
      required: true,
    },
  },
  computed: {
    ...mapGetters("contractors", ["getContractorById"]),
    orgObject() {
      if (this.org.name) {
        return this.org;
      }

      return this.getContractorById({ id: this.org.id });
    },
  },
};
</script>

<style lang="scss">
.ReportOrgRole {
  &__name {
    color: #354052;
    font-size: 16px;
    line-height: 1;
  }
  &__role {
    color: #7f8fa4;
    line-height: 1;
  }
}
</style>
