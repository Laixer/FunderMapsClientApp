<template>
  <div v-if="hasOrganization" class="ReportOrgRole d-flex align-items-center mt-4">
    <img :src="organization.getAvatar()" width="32" height="32" class="rounded-circle" />
    <div class="ml-3">
      <div class="ReportOrgRole__name">{{ organization.name }}</div>
      <div class="ReportOrgRole__role">{{ organizationRole }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
//import AttributedOrganisation from "../../../models/AttributedOrganisation";

export default {
  props: {
    organizationId: {
      type: String,
      required: true
    },
    organizationRoleOverride: {
      type: String,
      required: false
    }
  },
  data: function () {
    return {
      organization: null,
    };
  },
  computed: {
    organizationRole() {
      if (this.organizationRoleOverride) {
        return this.organizationRoleOverride; 
      } else {
        return this.organization.role;
      }
    },
    hasOrganization() {
      return this.organization;
    }
  },
  methods: {
    ...mapActions('org', ['getOrganizationById'])
  },
  async created() {
    this.organization = await this.getOrganizationById({ id: this.organizationId });
  }
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
