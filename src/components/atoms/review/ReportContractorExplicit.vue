<template>
  <div v-if="hasOrganization" class="ReportOrgRole d-flex align-items-center">
    <img :src="organization.getAvatar()" width="32" height="32" class="rounded-circle" />
    <div class="ml-3">
      <div class="ReportOrgRole__name">{{ organization.name }}</div>
      <div class="ReportOrgRole__role">Uitvoerder</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  props: {
    organizationId: {
      type: Number,
      required: true,
    },
  },
  computed: {
    ...mapGetters("contractors", ["getContractorById"]),
    organizationRole() {
      if (this.organizationRoleOverride) {
        return this.organizationRoleOverride;
      } else {
        return this.organization.role;
      }
    },
    hasOrganization() {
      return this.organization;
    },
    organization() {
      return this.getContractorById({ id: this.organizationId });
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
