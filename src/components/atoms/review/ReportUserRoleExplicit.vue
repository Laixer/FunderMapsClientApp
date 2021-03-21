<template>
  <div v-if="userObject" class="ReportUserRole d-flex align-items-center mt-4">
    <img
      :src="userObject.getAvatar()"
      width="32"
      height="32"
      class="rounded-circle"
    />
    <div class="ml-3">
      <div class="ReportUserRole__name">{{ userObject.getUserName() }}</div>
      <div class="ReportUserRole__role">{{ userRole }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  props: {
    userId: {
      type: String,
      required: true,
    },
    userRoleOverride: {
      type: String,
      required: false,
    },
  },
  computed: {
    ...mapGetters("orgUsers", ["getUserById"]),
    userObject() {
      return this.getUserById({ id: this.userId });
    },
    userRole() {
      if (this.userRoleOverride) {
        return this.userRoleOverride;
      } else {
        return this.userObject.getRole();
      }
    },
  },

  methods: {
    ...mapActions("orgUsers", ["getOrgUsersIfNotStored"]),
  },

  /**
   * Calls getReviewersIfNotStored to guarantee that we have
   * the involved users in our store.
   */
  async created() {
    await this.getOrgUsersIfNotStored({ id: this.userId });
  },
};
</script>

<style lang="scss">
.ReportUserRole {
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
